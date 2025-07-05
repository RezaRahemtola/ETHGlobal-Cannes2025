import json
import tempfile
from pathlib import Path

import aiohttp
from aleph.sdk.chains.ethereum import ETHAccount
from aleph.sdk.client import AuthenticatedAlephHttpClient
from aleph.sdk.conf import settings
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

from src.config import config

app = FastAPI(title="Elora backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[] + (["http://localhost:5173"] if config.IS_DEVELOPMENT else []),
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
                raise HTTPException(
                    status_code=response.status, detail="Failed to upload file to IPFS"
                )
            result = await response.json()
            ipfs_hash = result.get("IpfsHash")

            return {
                "ipfs_hash": ipfs_hash,
                "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
                "filename": file.filename,
                "size": result.get("PinSize", 0),
            }


@app.post("/deploy", description="Deploy a ZIP file as an Aleph program")
async def deploy_program(
    file: UploadFile = File(...), environment: str = Form("{}")
) -> dict:
    if file.filename and not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="File must be a ZIP file")

    try:
        env_vars = json.loads(environment)
        if not isinstance(env_vars, dict):
            raise ValueError("Environment must be a JSON object")
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400, detail="Invalid JSON in environment variables"
        )

    # Create authenticated client
    aleph_account = ETHAccount(config.ALEPH_SENDER_SK)
    client = AuthenticatedAlephHttpClient(account=aleph_account)

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as temp_file:
        file_content = await file.read()
        temp_file.write(file_content)
        temp_file.flush()

        try:
            # Upload the ZIP file to Aleph storage
            store_message, _ = await client.create_store(
                file_path=Path(temp_file.name), channel=settings.DEFAULT_CHANNEL
            )

            # Deploy the program
            program_result, status = await client.create_program(
                program_ref=store_message.item_hash,
                entrypoint="main:app",
                runtime=settings.DEFAULT_RUNTIME_ID,
                memory=256,
                timeout_seconds=10,
                internet=True,
                aleph_api=True,
                environment_variables=env_vars,
                metadata={
                    "name": file.filename,
                    "description": f"Deployed program from {file.filename}",
                },
            )

            return {
                "success": True,
                "program_hash": program_result.item_hash,
                "store_hash": store_message.item_hash,
                "program_url": f"https://scheduler.api.aleph.sh/api/v0/programs/{program_result.item_hash}",
                "status": status,
            }

        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Failed to deploy program: {str(e)}"
            )
        finally:
            # Clean up temp file
            Path(temp_file.name).unlink(missing_ok=True)
