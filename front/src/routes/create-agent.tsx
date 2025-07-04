import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/stores/wallet";
import { Bot, Globe, Shield, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/create-agent")({
	component: CreateAgent,
});

function CreateAgent() {
	const { isConnected } = useWalletStore();
	const router = useRouter();
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		ensName: "",
		capabilities: "",
		model: "gpt-4",
		privacy: "public",
	});

	useEffect(() => {
		if (!isConnected) {
			router.navigate({ to: "/" });
		}
	}, [isConnected, router]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Creating agent with data:", formData);
		alert("Agent creation submitted! (This is a mock implementation)");
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Create Your AI Agent</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
						Configure your intelligent AI agent with ENS identity and Oasis privacy features
					</p>
				</div>

				<Card className="shadow-xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bot className="h-6 w-6 text-blue-600" />
							Agent Configuration
						</CardTitle>
						<CardDescription>Set up your AI agent's identity, capabilities, and deployment preferences</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="name">Agent Name</Label>
									<Input
										id="name"
										placeholder="My AI Assistant"
										value={formData.name}
										onChange={(e) => handleInputChange("name", e.target.value)}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="ensName">ENS Name</Label>
									<Input
										id="ensName"
										placeholder="myagent.eth"
										value={formData.ensName}
										onChange={(e) => handleInputChange("ensName", e.target.value)}
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description</Label>
								<textarea
									id="description"
									className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
									placeholder="Describe what your AI agent does and its purpose..."
									value={formData.description}
									onChange={(e) => handleInputChange("description", e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="capabilities">Agent Capabilities</Label>
								<textarea
									id="capabilities"
									className="w-full min-h-[80px] px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
									placeholder="List the specific capabilities and skills your agent should have..."
									value={formData.capabilities}
									onChange={(e) => handleInputChange("capabilities", e.target.value)}
									required
								/>
							</div>

							<div className="grid md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="model">AI Model</Label>
									<select
										id="model"
										className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
										value={formData.model}
										onChange={(e) => handleInputChange("model", e.target.value)}
									>
										<option value="gpt-4">GPT-4</option>
										<option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
										<option value="claude-3">Claude 3</option>
										<option value="llama-2">Llama 2</option>
									</select>
								</div>
								<div className="space-y-2">
									<Label htmlFor="privacy">Privacy Level</Label>
									<select
										id="privacy"
										className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
										value={formData.privacy}
										onChange={(e) => handleInputChange("privacy", e.target.value)}
									>
										<option value="public">Public</option>
										<option value="private">Private (Oasis)</option>
										<option value="confidential">Confidential Computing</option>
									</select>
								</div>
							</div>

							<div className="border-t pt-6">
								<div className="grid md:grid-cols-3 gap-4 mb-6">
									<div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
										<Sparkles className="h-6 w-6 text-blue-600" />
										<div>
											<h3 className="font-semibold text-sm">AI Powered</h3>
											<p className="text-xs text-muted-foreground">Advanced reasoning</p>
										</div>
									</div>
									<div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
										<Globe className="h-6 w-6 text-green-600" />
										<div>
											<h3 className="font-semibold text-sm">ENS Identity</h3>
											<p className="text-xs text-muted-foreground">Permanent identity</p>
										</div>
									</div>
									<div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
										<Shield className="h-6 w-6 text-purple-600" />
										<div>
											<h3 className="font-semibold text-sm">Oasis Privacy</h3>
											<p className="text-xs text-muted-foreground">Secure computing</p>
										</div>
									</div>
								</div>
								<Button type="submit" className="w-full" size="lg">
									Deploy AI Agent
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
