import logging
import os

from dotenv import load_dotenv


class _Config:
    IS_DEVELOPMENT: bool
    PINATA_JWT: str

    def __init__(self):
        load_dotenv()
        self.IS_DEVELOPMENT = os.getenv("IS_DEVELOPMENT", "False").lower() == "true"
        self.PINATA_JWT = os.getenv("PINATA_JWT", "")

        # Configure logging
        log_level_str = os.getenv("LOG_LEVEL", "INFO").upper()
        self.LOG_LEVEL = getattr(logging, log_level_str, logging.INFO)
        self.LOG_FILE = os.getenv("LOG_FILE", None)


config = _Config()