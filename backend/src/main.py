from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import aiohttp

from src.config import config

app = FastAPI(title="Elora backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[]
    + (["http://localhost:5173"] if config.IS_DEVELOPMENT else []),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Elora backend!"}


@app.post("/upload", description="Upload a file to IPFS via Pinata")
async def upload_file(file: UploadFile = File(...)) -> dict:
    url = "https://api.pinata.cloud/pinning/pinFileToIPFS"

    data = aiohttp.FormData()
    data.add_field(
        name="file",
        value=await file.read(),
        filename=file.filename,
        content_type=file.content_type,
    )

    headers = {
        "Authorization": f"Bearer {config.PINATA_JWT}",
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=data, headers=headers) as response:
            if response.status != 200:
                raise HTTPException(status_code=response.status, detail="Failed to upload file to IPFS")
            result = await response.json()
            ipfs_hash = result.get("IpfsHash")
            
            return {
                "ipfs_hash": ipfs_hash,
                "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
                "filename": file.filename,
                "size": result.get("PinSize", 0)
            }
