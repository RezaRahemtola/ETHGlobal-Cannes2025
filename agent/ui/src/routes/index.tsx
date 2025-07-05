import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { thirdwebClient } from "@/config/thirdweb";
import { useWalletStore } from "@/stores/wallet";
import { useChatStore } from "@/stores/chat";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { Card } from "@/components/ui/card";
import { generateResponse } from "@/services/api";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const { address, isConnected, signature, setSignature } = useWalletStore();
	const { messages, isLoading, addMessage, setLoading } = useChatStore();
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const account = useActiveAccount();

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const signMessage = async () => {
		if (!account || !address) return;

		try {
			const authMessage = `Sign with your wallet ${address.toLowerCase()} to access the Elara agent.`;
			const signedMessage = await account.signMessage({
				message: authMessage,
			});
			setSignature(signedMessage);
		} catch (error) {
			console.error("Failed to sign message:", error);
		}
	};

	const handleSendMessage = async (content: string) => {
		if (!address || !signature) return;

		const userMessage = { role: "user" as const, content };
		addMessage(userMessage);
		setLoading(true);

		try {
			const allMessages = [...messages, userMessage];
			const aiResponse = await generateResponse(allMessages, address, signature);

			// Add all AI response messages
			aiResponse.forEach((msg) => addMessage(msg));
		} catch (error) {
			console.error("Failed to get AI response:", error);
			addMessage({
				role: "assistant",
				content: "Sorry, I encountered an error. Please try again.",
			});
		} finally {
			setLoading(false);
		}
	};

	if (!isConnected) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<Card className="p-8 max-w-md w-full text-center">
					<h1 className="text-2xl font-bold mb-4">Chat with AI Agent</h1>
					<p className="text-gray-600 mb-6">Connect your wallet to start chatting with the AI agent</p>
					<ConnectButton client={thirdwebClient} />
				</Card>
			</div>
		);
	}

	if (!signature) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-4">
				<Card className="p-8 max-w-md w-full text-center">
					<h1 className="text-2xl font-bold mb-4">Sign Message</h1>
					<p className="text-gray-600 mb-6">Please sign a message to authenticate with the AI agent</p>
					<button onClick={signMessage} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md">
						Sign Message
					</button>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-col h-screen">
			<div className="border-b p-4">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-bold">AI Agent Chat</h1>
					<ConnectButton client={thirdwebClient} />
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 && (
					<div className="text-center text-gray-500 mt-8">
						<p>Start a conversation with the AI agent!</p>
					</div>
				)}

				{messages.map((message, index) => (
					<ChatMessage key={index} message={message} />
				))}

				{isLoading && (
					<div className="flex justify-start">
						<Card className="bg-gray-100 px-4 py-2 max-w-xs lg:max-w-md">
							<p className="text-sm text-gray-600">AI is thinking...</p>
						</Card>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			<div className="border-t p-4">
				<ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
			</div>
		</div>
	);
}
