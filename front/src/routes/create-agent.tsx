import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/stores/wallet";
import { Bot, Globe, Shield, Sparkles } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/create-agent")({
	component: CreateAgent,
});

function CreateAgent() {
	const { isConnected } = useWalletStore();
	const router = useRouter();
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		identifier: "",
	});

	useEffect(() => {
		if (!isConnected) {
			toast.error("Please connect your wallet to create an agent.");
			router.navigate({ to: "/" });
		}
	}, [isConnected, router]);

	const handleSubmit = (e: FormEvent) => {
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
						<CardDescription>Set up your AI agent's identity</CardDescription>
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
									<Label htmlFor="ensName">Identifier (ENS name)</Label>
									<Input
										id="ensName"
										placeholder="myagent"
										value={formData.identifier}
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

							<div className="pt-6">
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
