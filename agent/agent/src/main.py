from datetime import datetime
from http import HTTPStatus

from elara_wrapper import add_elara_middleware, GeneratePostRequestBody
from fastapi import FastAPI, HTTPException

from agent.crew import AgentCrew

app = FastAPI()

# Add the Elara middleware with a validation string
middleware = add_elara_middleware(app, "True")


@app.post("/generate")
async def root(body: GeneratePostRequestBody):

    inputs = {
        'topic': body.prompt,
        'current_year': str(datetime.now().year)
    }

    try:
        output = AgentCrew().crew().kickoff(inputs=inputs)
        return {"message": "Crew executed successfully", "output": output.raw}
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR, detail=f"An error occurred while running the crew: {e}")

