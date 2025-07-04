from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
