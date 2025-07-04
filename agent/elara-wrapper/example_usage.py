"""
Example usage of Elara Wrapper middleware
"""

from fastapi import FastAPI

from elara_wrapper import add_elara_middleware

app = FastAPI()

# Add the Elara middleware with a validation string
middleware = add_elara_middleware(app, "TODO")


@app.get("/")
async def root():
    return {"message": "Hello World"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
