import { Message } from "@/types/chat";

const API_BASE_URL = "http://localhost:8000";

export async function generateResponse(messages: Message[], address: string, signature: string): Promise<Message[]> {
	const response = await fetch(`${API_BASE_URL}/generate`, {
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
