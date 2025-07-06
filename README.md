# 🇫🇷 ETHGlobal Cannes 2025 - [Elara](https://ethglobal.com/showcase/elara-cvb2y)

One-click deployment of secure, decentralized AI agents with full identity & access control.

Elara allows you to easily deploy AI Agents that have their own identity and with which you can interact with a simple interface. Fully decentralized & with a permissions system to limit interactions to whitelisted users, Elara is a powerful platform to deploy agents for various use cases (sharing a small agent with friends & family, create an agent for your company accessible only by employees, or even fully autonomous AI Agents that could manage their own identity).

Elara is meant to be a powerful primitive and reflection on what's possible by combining decentralization with AI.

## ⚙️ Installation

To run the project locally, simply clone the repository and follow these steps

### Contracts

The following contract addresses are the ones of the deployed version on Base mainnet, feel free to use them or to redeploy the contracts (located in [the contracts folder](./contracts/) if they are default ones).
- ENS L2Registry: [`0xc3a4eb979e9035486b54fe8b57d36aef9519eac6`](https://basescan.org/address/0xc3a4eb979e9035486b54fe8b57d36aef9519eac6)
- ENS L2Registrar: [`0xc4c53E8DdeEb88F6a8F0372f312f5A6D2a37C66e`](https://basescan.org/address/0xc4c53E8DdeEb88F6a8F0372f312f5A6D2a37C66e)

### Frontend

Duplicate the `.env.example` file into `.env` and fill the required variables:
```sh
# ThirdWeb setup
VITE_THIRDWEB_CLIENT_ID=

# URL where you will deploy the backend, this is the default
VITE_BACKEND_API_URL=http://localhost:8000

# The deployed version of the contracts
VITE_ENS_BASE_REGISTRAR_CONTRACT_ADDRESS=0xc4c53E8DdeEb88F6a8F0372f312f5A6D2a37C66e
VITE_ENS_BASE_REGISTRY_CONTRACT_ADDRESS=0xc3a4eB979e9035486b54Fe8b57D36aEF9519eAc6
```


Then you just need to install the dependencies and start the project:
```sh
npm install
npm run dev
```

### Backend

Again, duplicate the `.env.example` file into `.env` and fill the required variables.

All variables are self-explanatory and default values are generally fine.\
There's only a Pinata account & API key to create, and a wallet to top up with $ALEPH tokens to create the VMs
```sh
# -- Logging --
LOG_LEVEL=INFO
LOG_FILE=

# -- Miscellaneous --
IS_DEVELOPMENT=False
PINATA_JWT=
ALEPH_SENDER_SK=
```

Install the dependencies & launch the FastAPI backend:
```sh
python -m venv venv
source venv/bin/activate
poetry install
python -m uvicorn src.main:app --reload
```

To launch the API in production, simply run `docker compose up -d`.

### Agent

This is a part that you shouldn't need to touch at all, but here are some explanations for your understanding or if you really want to customize them. 

An example of an AI Agent can be seen in [agent/agent](./agent/agent/), to deploy it simply zip the `main.py` and the `run` files together.\
The [`agent/elara-wrapper`](./agent/elara-wrapper/) contains a package [deployed on PyPi](https://pypi.org/project/elara-wrapper/) that can be used in the agent to add whitelisted addresses control, although it's still unstable especially in production (the RPC requests and the Aleph execution environment don't seem to mix well ☹️). This runtime was customized a bit from the default provided and its code can be found in [`agent/runtime`](./agent/runtime).\
Finally, the UI deployed on the ENS content hash is in [`agent/ui`](./agent/ui/) if you need to modify it (you'll also need to change its hash in the Elara frontend).

## 🚀 Getting started

To use Elara, you can either follow the steps above to launch your own version of the app or use the [deployed version](https://elara.rezar.fr).

## 📈 Current caveats and future improvements

As a hackathon project built in solo, this is obviously not finished and can be improved in many ways. Some examples and ideas I'd like to explore are listed below

- 📈 UI / UX improvements
  - Add a page to see deployed agents (storing the list on chain) and allowing to edit the agent metadata, especially the whitelisted addresses
  - Abstracting the wallet funding part to allow credit card payments or similar alternatives
- ⚙️ Agents controlling the wallet with their identity and autonomously updating it when needed
- 🧠 More AI Agents framework support by generalizing further the agent API route format

<div align="center">
  <h2>Made with ❤️ by</h2>
  <a href="https://github.com/RezaRahemtola">
    <img src="https://github.com/RezaRahemtola.png?size=85" width=85/>
    <br>
    <sub>Reza Rahemtola</sub>
  </a>
</div>
