import os
from http import HTTPStatus

from dotenv import load_dotenv
from elara_wrapper import (
    GeneratePostRequestBody,
)
from fastapi import FastAPI, HTTPException
from libertai_agents.agents import Agent
from libertai_agents.interfaces.messages import Message
from libertai_agents.interfaces.tools import Tool
from libertai_agents.models import get_model
from starlette.middleware.cors import CORSMiddleware

load_dotenv()


async def get_current_temperature(location: str, unit: str) -> float:
    """
    Get the current temperature at a location.

    Args:
        location: The location to get the temperature for, in the format "City, Country"
        unit: The unit to return the temperature in. (choices: ["celsius", "fahrenheit"])
    Returns:
        The current temperature at the specified location in the specified units, as a float.
    """
    return 22.0  # A real function should probably actually get the temperature!


agent = Agent(
    model=get_model("NousResearch/Hermes-3-Llama-3.1-8B"),
    system_prompt="You are a helpful assistant",
    tools=[Tool.from_function(get_current_temperature)],
    api_key=os.getenv("LIBERTAI_API_KEY"),
    expose_api=False,
)

ens_subname = os.getenv("ELARA_ENS_SUBNAME")

app = FastAPI()

# Add CORS middleware first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"]
    + [f"https://{ens_subname}.elara-app.eth.limo"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add the Elara middleware
# app.add_middleware(ElaraMiddleware, ens_name=os.getenv("ELARA_ENS_SUBNAME"))


@app.post("/generate")
async def root(body: GeneratePostRequestBody):
    try:
        response_messages: list[Message] = []
        async for message in agent.generate_answer(body.messages):
            response_messages.append(message)
        return response_messages
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while running the agent: {e}",
        )
