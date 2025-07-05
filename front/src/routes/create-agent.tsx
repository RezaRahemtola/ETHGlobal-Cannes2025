import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/stores/wallet";
import { Bot, Globe, Shield, Sparkles, Plus, X, Upload, User, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { checkENSAvailability, type ENSAvailabilityResult } from "@/utils/ensAvailability";
import { validateENSName, ENS_CONFIG } from "@/config/ens";
import env from "@/config/env";

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
		profilePicture: null as File | null,
	});

	const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([
		{ key: "", value: "" }
	]);

	// ENS availability state
	const [ensAvailability, setEnsAvailability] = useState<ENSAvailabilityResult | null>(null);
	const [isCheckingENS, setIsCheckingENS] = useState(false);
	const [ensValidation, setEnsValidation] = useState<{ valid: boolean; error?: string } | null>(null);

	useEffect(() => {
		if (!isConnected) {
			toast.error("Please connect your wallet to create an agent.");
			router.navigate({ to: "/" });
		}
	}, [isConnected, router]);

	// Check ENS availability
	const checkENS = useCallback(async (identifier: string) => {
		if (!identifier.trim()) {
			setEnsAvailability(null);
			setEnsValidation(null);
			return;
		}

		// Validate name format
		const validation = validateENSName(identifier);
		setEnsValidation(validation);

		if (!validation.valid) {
			setEnsAvailability(null);
			return;
		}

		setIsCheckingENS(true);
		try {
			const result = await checkENSAvailability(identifier.trim(), env.ENS_CONTRACT_ADDRESS);
			setEnsAvailability(result);
		} finally {
			setIsCheckingENS(false);
		}
	}, []);

	// Debounce ENS check
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			if (formData.identifier) {
				checkENS(formData.identifier);
			}
		}, ENS_CONFIG.OPTIONS.DEBOUNCE_DELAY);

		return () => clearTimeout(timeoutId);
	}, [formData.identifier, checkENS]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		
		// Validate ENS name format and availability before submission
		if (!ensValidation?.valid) {
			toast.error(ensValidation?.error || "Please enter a valid ENS name.");
			return;
		}

		if (!ensAvailability?.available) {
			toast.error(ensAvailability?.error || "Please choose an available ENS name before submitting.");
			return;
		}

		console.log("Creating agent with data:", formData);
		console.log("Environment variables:", envVars);
		console.log("Profile picture:", formData.profilePicture ? `${formData.profilePicture.name} (${formData.profilePicture.size} bytes)` : "None");
		console.log("ENS availability:", ensAvailability);
		alert("Agent creation submitted! (This is a mock implementation)");
	};

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	const handleFileChange = (file: File | null) => {
		setFormData((prev) => ({ ...prev, profilePicture: file }));
	};

	const addEnvVar = () => {
		setEnvVars([...envVars, { key: "", value: "" }]);
	};

	const removeEnvVar = (index: number) => {
		if (envVars.length > 1) {
			setEnvVars(envVars.filter((_, i) => i !== index));
		}
	};

	const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
		const updated = envVars.map((envVar, i) =>
			i === index ? { ...envVar, [field]: value } : envVar
		);
		setEnvVars(updated);
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
									<div className="relative">
										<Input
											id="ensName"
											placeholder="myagent"
											value={formData.identifier}
											onChange={(e) => handleInputChange("identifier", e.target.value)}
											required
											className={`pr-10 ${
												ensValidation && !ensValidation.valid
													? "border-red-500 focus:border-red-500"
													: ensValidation?.valid && ensAvailability
													? ensAvailability.available
														? "border-green-500 focus:border-green-500"
														: "border-red-500 focus:border-red-500"
													: ""
											}`}
										/>
										<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
											{isCheckingENS ? (
												<Loader2 className="h-4 w-4 animate-spin text-gray-400" />
											) : ensValidation && !ensValidation.valid ? (
												<XCircle className="h-4 w-4 text-red-500" />
											) : ensValidation?.valid && ensAvailability ? (
												ensAvailability.available ? (
													<CheckCircle className="h-4 w-4 text-green-500" />
												) : (
													<XCircle className="h-4 w-4 text-red-500" />
												)
											) : null}
										</div>
									</div>
									{/* ENS Validation Messages */}
									{ensValidation && !ensValidation.valid && (
										<p className="text-sm text-red-600">
											✗ {ensValidation.error}
										</p>
									)}
									{ensValidation?.valid && ensAvailability && (
										<p className={`text-sm ${
											ensAvailability.available
												? "text-green-600"
												: "text-red-600"
										}`}>
											{ensAvailability.available
												? `✓ ${formData.identifier} is available`
												: `✗ ${ensAvailability.error || `${formData.identifier} is not available`}`}
										</p>
									)}
									<div className="text-xs text-muted-foreground mt-1">
										Name requirements: {ENS_CONFIG.OPTIONS.MIN_NAME_LENGTH}-{ENS_CONFIG.OPTIONS.MAX_NAME_LENGTH} characters, alphanumeric and hyphens only.
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="profilePicture">Profile Picture (Optional)</Label>
								<div className="flex items-center gap-4">
									<div className="flex-shrink-0 relative group">
										{formData.profilePicture ? (
											<>
												<img
													src={URL.createObjectURL(formData.profilePicture)}
													alt="Profile preview"
													className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
												/>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => handleFileChange(null)}
													className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white p-0 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
												>
													<X className="h-3 w-3" />
												</Button>
											</>
										) : (
											<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 flex items-center justify-center">
												<User className="h-8 w-8 text-gray-400" />
											</div>
										)}
									</div>
									<div className="flex-1">
										<input
											id="profilePicture"
											type="file"
											accept="image/*"
											onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
											className="hidden"
										/>
										<Button
											type="button"
											variant="outline"
											onClick={() => document.getElementById('profilePicture')?.click()}
											className="flex items-center gap-2"
										>
											<Upload className="h-4 w-4" />
											{formData.profilePicture ? 'Change Picture' : 'Upload Picture'}
										</Button>
									</div>
								</div>
								<p className="text-sm text-muted-foreground">
									Upload a profile picture for your AI agent. Supported formats: JPG, PNG, GIF (max 5MB)
								</p>
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

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label className="text-base font-medium">Environment Variables</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={addEnvVar}
										className="flex items-center gap-1"
									>
										<Plus className="h-4 w-4" />
										Add Variable
									</Button>
								</div>
								<p className="text-sm text-muted-foreground">
									These variables will be encrypted and securely stored on-chain with Oasis privacy features.
								</p>
								<div className="space-y-3">
									{envVars.map((envVar, index) => (
										<div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800">
											<div className="flex-1">
												<Input
													placeholder="Variable name (e.g., API_KEY)"
													value={envVar.key}
													onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
													className="bg-white dark:bg-gray-700"
												/>
											</div>
											<div className="flex-1">
												<Input
													placeholder="Variable value"
													type="password"
													value={envVar.value}
													onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
													className="bg-white dark:bg-gray-700"
												/>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeEnvVar(index)}
												disabled={envVars.length === 1}
												className="p-2"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
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
