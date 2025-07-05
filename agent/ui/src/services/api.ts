import { Message } from "@/types/chat";
import { thirdwebClient } from "@/config/thirdweb";
import { base } from "thirdweb/chains";
import { getContract, readContract } from "thirdweb";
import keccak from "keccak";

const ENS_REGISTRY_ADDRESS = "0xc3a4eB979e9035486b54Fe8b57D36aEF9519eAc6";

let cachedApiBaseUrl: string | null = null;
let apiBaseUrlPromise: Promise<string> | null = null;

async function resolveDynamicApiBaseUrl(): Promise<string> {
	try {
		const hostname = window.location.hostname;

		let ensName: string;
		console.log(hostname);
		if (hostname.includes(".eth.limo")) {
			ensName = hostname.replace(".eth.limo", "");
		} else if (hostname.includes(".eth")) {
			ensName = hostname;
		} else {
			return "http://localhost:8000";
		}

		const subdomain = ensName.split(".")[0];
		const fullEnsName = `${subdomain}.elara-app.eth`;

		const contract = getContract({
			client: thirdwebClient,
			chain: base,
			address: ENS_REGISTRY_ADDRESS,
			abi: [
				{
					inputs: [
						{ name: "node", type: "bytes32" },
						{ name: "key", type: "string" },
					],
					name: "text",
					outputs: [{ name: "", type: "string" }],
					stateMutability: "view",
					type: "function",
				},
			],
		});

		const textRecord = await readContract({
			contract,
			method: "text",
			params: [ensNameToNode(fullEnsName) as `0x${string}`, "aleph_vm_hash"],
		});

		if (textRecord) {
			return `https://aleph-crn.rezar.fr/vm/${textRecord}`;
		}

		return "http://localhost:8000";
	} catch (error) {
		console.error("Failed to resolve ENS:", error);
		return "http://localhost:8000";
	}
}

function ensNameToNode(name: string): string {
	const labels = name.split(".");
	let node = "0x0000000000000000000000000000000000000000000000000000000000000000";

	for (let i = labels.length - 1; i >= 0; i--) {
		const labelHash = keccak("keccak256").update(labels[i]).digest("hex");
		node = keccak("keccak256")
			.update(Buffer.from(node.slice(2) + labelHash, "hex"))
			.digest("hex");
		node = "0x" + node;
	}

	return node;
}

function initializeApiBaseUrl(): void {
	if (!apiBaseUrlPromise) {
		apiBaseUrlPromise = resolveDynamicApiBaseUrl().then((url) => {
			cachedApiBaseUrl = url;
			return url;
		});
	}
}

initializeApiBaseUrl();

export interface AgentMetadata {
	name: string;
	description: string;
	avatar: string;
}

async function getEnsTextRecord(key: string): Promise<string> {
	try {
		const hostname = window.location.hostname;

		let ensName: string;
		if (hostname.includes(".eth.limo")) {
			ensName = hostname.replace(".eth.limo", "");
		} else if (hostname.includes(".eth")) {
			ensName = hostname;
		} else {
			return "";
		}

		const subdomain = ensName.split(".")[0];
		const fullEnsName = `${subdomain}.elara-app.eth`;

		const contract = getContract({
			client: thirdwebClient,
			chain: base,
			address: ENS_REGISTRY_ADDRESS,
			abi: [
				{
					inputs: [
						{ name: "node", type: "bytes32" },
						{ name: "key", type: "string" },
					],
					name: "text",
					outputs: [{ name: "", type: "string" }],
					stateMutability: "view",
					type: "function",
				},
			],
		});

		const textRecord = await readContract({
			contract,
			method: "text",
			params: [ensNameToNode(fullEnsName) as `0x${string}`, key],
		});

		return textRecord || "";
	} catch (error) {
		console.error(`Failed to get ENS text record for key ${key}:`, error);
		return "";
	}
}

async function getEnsAllowedCallers(): Promise<string[]> {
	try {
		const allowedCallersRecord = await getEnsTextRecord("allowed_callers");
		
		if (allowedCallersRecord) {
			return allowedCallersRecord.split(",").map((addr: string) => addr.trim().toLowerCase());
		}

		return [];
	} catch (error) {
		console.error("Failed to get allowed callers:", error);
		return [];
	}
}

export async function getAgentMetadata(): Promise<AgentMetadata> {
	try {
		const [name, description, avatar] = await Promise.all([
			getEnsTextRecord("name"),
			getEnsTextRecord("description"),
			getEnsTextRecord("avatar"),
		]);

		return {
			name: name || "AI Agent",
			description: description || "Your AI assistant",
			avatar: avatar || "",
		};
	} catch (error) {
		console.error("Failed to get agent metadata:", error);
		return {
			name: "AI Agent",
			description: "Your AI assistant",
			avatar: "",
		};
	}
}

export async function generateResponse(messages: Message[], address: string, signature: string): Promise<Message[]> {
	const allowedCallers = await getEnsAllowedCallers();

	if (allowedCallers.length > 0 && !allowedCallers.includes(address.toLowerCase())) {
		throw new Error("Address not authorized to access this agent. Please check with the agent owner.");
	}

	const apiBaseUrl = cachedApiBaseUrl || (await apiBaseUrlPromise) || "http://localhost:8000";
	const response = await fetch(`${apiBaseUrl}/generate`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			messages,
			address,
			signature,
		}),
	});

	const data = await response.json();

	if (!response.ok) {
		throw new Error(data.detail || data.message || data.error || `Request failed with status ${response.status}`);
	}

	return data;
}
