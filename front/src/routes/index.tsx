import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletStore } from "@/stores/wallet";
import { Bot, Cpu, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const { isConnected } = useWalletStore();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="text-center mb-16">
					<h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
						Deploy AI Agents with <span className="text-blue-600">ENS & Oasis ROFL</span>
					</h1>
					<p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
						Easily deploy AI agents with human-readable ENS domains, restricted permissions, and Oasis ROFL TEE for
						secure computation with local models.
					</p>
					{!isConnected && (
						<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-md mx-auto">
							<p className="text-yellow-800 dark:text-yellow-200">Connect your wallet to start creating AI agents</p>
						</div>
					)}
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="text-center">
							<Bot className="h-12 w-12 mx-auto text-blue-600 mb-4" />
							<CardTitle>Smart AI Agents</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								Access your AI agents through human-readable ENS domains like myagent.eth
							</CardDescription>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="text-center">
							<Lock className="h-12 w-12 mx-auto text-green-600 mb-4" />
							<CardTitle>Restricted Permissions</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>Fine-grained control over what your AI agents can access and do</CardDescription>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="text-center">
							<Cpu className="h-12 w-12 mx-auto text-purple-600 mb-4" />
							<CardTitle>Oasis ROFL TEE</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>
								Run your AI agents in secure Trusted Execution Environments with local models
							</CardDescription>
						</CardContent>
					</Card>

					<Card className="hover:shadow-lg transition-shadow">
						<CardHeader className="text-center">
							<Bot className="h-12 w-12 mx-auto text-orange-600 mb-4" />
							<CardTitle>Easy Deployment</CardTitle>
						</CardHeader>
						<CardContent>
							<CardDescription>Deploy your AI agents in minutes with our simple interface</CardDescription>
						</CardContent>
					</Card>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
					<div className="max-w-4xl mx-auto">
						<h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">How It Works</h2>
						<div className="grid md:grid-cols-3 gap-8">
							<div className="text-center">
								<div className="bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
									<span className="text-2xl font-bold text-blue-600">1</span>
								</div>
								<h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Connect Wallet</h3>
								<p className="text-gray-600 dark:text-gray-300">
									Connect your Web3 wallet to get started with agent creation
								</p>
							</div>
							<div className="text-center">
								<div className="bg-green-100 dark:bg-green-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
									<span className="text-2xl font-bold text-green-600">2</span>
								</div>
								<h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Configure Agent</h3>
								<p className="text-gray-600 dark:text-gray-300">
									Set up your AI agent's parameters, ENS domain, and permission restrictions
								</p>
							</div>
							<div className="text-center">
								<div className="bg-purple-100 dark:bg-purple-900/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
									<span className="text-2xl font-bold text-purple-600">3</span>
								</div>
								<h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Deploy to TEE</h3>
								<p className="text-gray-600 dark:text-gray-300">
									Deploy your agent to Oasis ROFL TEE for secure, private execution
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
