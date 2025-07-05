import os
from http import HTTPStatus

from dotenv import load_dotenv
from elara_wrapper import (
    elara_auth_router,
    GeneratePostRequestBody,
    add_elara_middleware,
)
from fastapi import FastAPI, HTTPException
from libertai_agents.agents import Agent
from libertai_agents.interfaces.messages import Message
from libertai_agents.interfaces.tools import Tool
from libertai_agents.models import get_model

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

app = FastAPI()

# Add the Elara middleware & auth router
add_elara_middleware(app, "True")
app.include_router(elara_auth_router)


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
