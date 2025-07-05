import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWalletStore } from "@/stores/wallet";
import {
	AlertCircle,
	Bot,
	CheckCircle,
	Copy,
	Globe,
	Loader2,
	Plus,
	Shield,
	Sparkles,
	Upload,
	User,
	Wallet,
	X,
	XCircle,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { checkENSAvailability, type ENSAvailabilityResult } from "@/utils/ensAvailability";
import { ENS_CONFIG, validateENSName } from "@/config/ens";
import env from "@/config/env";
import { useActiveWallet } from "thirdweb/react";
import { Account, privateKeyToAccount } from "thirdweb/wallets";
import { thirdwebClient } from "@/config/thirdweb";
import { base } from "thirdweb/chains";
import { eth_getBalance, getRpcClient } from "thirdweb/rpc";
import { encodePacked, keccak256 } from "thirdweb/utils";
import { getContract, prepareContractCall, sendTransaction, waitForReceipt } from "thirdweb";
import { uploadFileUploadPost } from "@/apis/backend/sdk.gen";

export const Route = createFileRoute("/create-agent")({
	component: CreateAgent,
});

function CreateAgent() {
	const { isConnected, address } = useWalletStore();
	const router = useRouter();
	const activeWallet = useActiveWallet();
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		identifier: "",
		profilePicture: null as File | null,
	});

	const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([{ key: "", value: "" }]);

	const [authorizedAddresses, setAuthorizedAddresses] = useState<string[]>([]);

	// ENS availability state
	const [ensAvailability, setEnsAvailability] = useState<ENSAvailabilityResult | null>(null);
	const [isCheckingENS, setIsCheckingENS] = useState(false);
	const [ensValidation, setEnsValidation] = useState<{ valid: boolean; error?: string } | null>(null);

	// Deployment state
	const [isDeploying, setIsDeploying] = useState(false);
	const [deploymentStep, setDeploymentStep] = useState<"form" | "signing" | "funding" | "registering" | "deployed">(
		"form",
	);
	const [agentWallet, setAgentWallet] = useState<{ address: string; privateKey: string } | null>(null);
	const [isCheckingBalance, setIsCheckingBalance] = useState(false);
	const [walletBalance, setWalletBalance] = useState<string>("0");
	const [registrationProgress, setRegistrationProgress] = useState<{
		ensRegistered: "pending" | "loading" | "completed";
		contentHashSet: "pending" | "loading" | "completed";
		allowedCallersSet: "pending" | "loading" | "completed";
		avatarSet: "pending" | "loading" | "completed";
	}>({ ensRegistered: "pending", contentHashSet: "pending", allowedCallersSet: "pending", avatarSet: "pending" });

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
			const result = await checkENSAvailability(identifier.trim(), env.ENS_BASE_REGISTRAR_CONTRACT_ADDRESS);
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

	const handleSubmit = async (e: FormEvent) => {
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

		setIsDeploying(true);

		try {
			// Step 1: Sign message and create agent wallet
			const walletInfo = await signMessageAndCreateWallet();

			console.log("Creating agent with data:", formData);
			console.log("Environment variables:", envVars);
			console.log("Authorized addresses:", getAllAuthorizedAddresses());
			console.log("Agent wallet:", walletInfo);
			console.log(
				"Profile picture:",
				formData.profilePicture ? `${formData.profilePicture.name} (${formData.profilePicture.size} bytes)` : "None",
			);
			console.log("ENS availability:", ensAvailability);
		} catch (error) {
			console.error("Error creating agent:", error);
			setIsDeploying(false);
		}
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

	const updateEnvVar = (index: number, field: "key" | "value", value: string) => {
		const updated = envVars.map((envVar, i) => (i === index ? { ...envVar, [field]: value } : envVar));
		setEnvVars(updated);
	};

	const addAuthorizedAddress = () => {
		setAuthorizedAddresses([...authorizedAddresses, ""]);
	};

	const removeAuthorizedAddress = (index: number) => {
		setAuthorizedAddresses(authorizedAddresses.filter((_, i) => i !== index));
	};

	const updateAuthorizedAddress = (index: number, value: string) => {
		const updated = authorizedAddresses.map((addr, i) => (i === index ? value : addr));
		setAuthorizedAddresses(updated);
	};

	const getAllAuthorizedAddresses = () => {
		const addresses = [address, ...authorizedAddresses].filter(Boolean);
		return [...new Set(addresses)]; // Remove duplicates
	};

	const signMessageAndCreateWallet = async () => {
		if (!activeWallet) {
			throw new Error("No active wallet found");
		}

		const account = activeWallet.getAccount();
		if (!account) {
			throw new Error("No account found");
		}

		const message = `Sign this message to generate the wallet for your agent '${formData.identifier}'. Do sign sign this message anywhere else than on the official Elara platform.`;

		setDeploymentStep("signing");
		toast.info("Please sign the message to create your agent wallet...");

		try {
			const signature = await account.signMessage({ message });
			const privateKey = keccak256(signature);
			const agentAccount = privateKeyToAccount({
				client: thirdwebClient,
				privateKey: privateKey,
			});

			const walletInfo = {
				address: agentAccount.address,
				privateKey: privateKey,
			};

			setAgentWallet(walletInfo);
			setDeploymentStep("funding");
			toast.success("Agent wallet created successfully!");

			// Start checking balance
			startBalancePolling(walletInfo);

			return walletInfo;
		} catch (error) {
			console.error("Error signing message:", error);
			toast.error("Failed to sign message. Please try again.");
			setDeploymentStep("form");
			throw error;
		}
	};

	const checkWalletBalance = async (walletAddress: string) => {
		try {
			const rpcRequest = getRpcClient({
				client: thirdwebClient,
				chain: base,
			});
			const balance = await eth_getBalance(rpcRequest, { address: walletAddress });
			const balanceInEth = Number(balance) / 1e18;
			console.log(balanceInEth);
			setWalletBalance(balanceInEth.toFixed(6));
			return balanceInEth;
		} catch (error) {
			console.error("Error checking balance:", error);
			return 0;
		}
	};

	const startBalancePolling = async (walletInfo: { address: string; privateKey: `0x${string}` }) => {
		setIsCheckingBalance(true);

		const pollBalance = async () => {
			const balance = await checkWalletBalance(walletInfo.address);

			if (balance >= 0.0001) {
				// Minimum 0.0001 ETH required
				setIsCheckingBalance(false);
				toast.success("Agent wallet funded successfully! Starting ENS registration...");

				// Start ENS registration process
				try {
					await registerENSAndSetRecords(walletInfo);
				} catch (error) {
					console.error("ENS registration failed:", error);
					toast.error(`ENS registration failed: ${error instanceof Error ? error.message : "Unknown error"}`);
					setDeploymentStep("funding");
					setIsCheckingBalance(true);
					setTimeout(pollBalance, 3000); // Continue polling
				}
				return true;
			}

			// Continue polling if balance is insufficient
			setTimeout(pollBalance, 3000); // Check every 3 seconds
		};

		pollBalance();
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard!");
	};

	// Manual namehash implementation since it's not available in thirdweb/utils
	const namehash = (name: string): `0x${string}` => {
		let node = "0x0000000000000000000000000000000000000000000000000000000000000000";
		if (name) {
			const labels = name.split(".");
			for (let i = labels.length - 1; i >= 0; i--) {
				const labelHash = keccak256(encodePacked(["string"], [labels[i]]));
				node = keccak256(encodePacked(["bytes32", "bytes32"], [node as `0x${string}`, labelHash]));
			}
		}
		return node as `0x${string}`;
	};

	const registerENSAndSetRecords = async (walletInfo: { address: string; privateKey: `0x${string}` }) => {
		setDeploymentStep("registering");

		try {
			const agentAccount = privateKeyToAccount({
				client: thirdwebClient,
				privateKey: walletInfo.privateKey,
			});

			// Step 1: Register ENS name
			setRegistrationProgress((prev) => ({ ...prev, ensRegistered: "loading" }));
			await registerENSName(agentAccount);
			setRegistrationProgress((prev) => ({ ...prev, ensRegistered: "completed" }));
			
			// Wait before next transaction to avoid nonce issues
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Step 2: Set content hash
			setRegistrationProgress((prev) => ({ ...prev, contentHashSet: "loading" }));
			await setContentHash(agentAccount);
			setRegistrationProgress((prev) => ({ ...prev, contentHashSet: "completed" }));
			
			// Wait before next transaction
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Step 3: Set allowed callers
			setRegistrationProgress((prev) => ({ ...prev, allowedCallersSet: "loading" }));
			await setAllowedCallers(agentAccount);
			setRegistrationProgress((prev) => ({ ...prev, allowedCallersSet: "completed" }));

			// Step 4: Set avatar if profile picture exists
			if (formData.profilePicture) {
				// Wait before next transaction
				await new Promise(resolve => setTimeout(resolve, 2000));
				setRegistrationProgress((prev) => ({ ...prev, avatarSet: "loading" }));
				await setAvatar(agentAccount);
				setRegistrationProgress((prev) => ({ ...prev, avatarSet: "completed" }));
			} else {
				setRegistrationProgress((prev) => ({ ...prev, avatarSet: "completed" }));
			}

			setDeploymentStep("deployed");
		} catch (error) {
			console.error("Error during ENS registration:", error);
			throw error;
		}
	};

	const registerENSName = async (account: Account) => {
		const registrarContract = getContract({
			client: thirdwebClient,
			chain: base,
			address: env.ENS_BASE_REGISTRAR_CONTRACT_ADDRESS,
		});

		// Register the name using the correct ABI
		const transaction = prepareContractCall({
			contract: registrarContract,
			method: "function register(string label, address owner)",
			params: [formData.identifier, account.address],
		});

		const result = await sendTransaction({
			transaction,
			account,
		});

		await waitForReceipt({
			client: thirdwebClient,
			chain: base,
			transactionHash: result.transactionHash,
		});
	};

	const setContentHash = async (account: Account) => {
		const registryContract = getContract({
			client: thirdwebClient,
			chain: base,
			address: env.ENS_BASE_REGISTRY_CONTRACT_ADDRESS,
		});

		// Hardcoded content hash
		const contentHashBytes = "0xe3010170122029f2d17be6139079dc48696d1f582a8530eb9805b561eda517e22a892c7e3f1f";
		const node = namehash(`${formData.identifier}.elara-app.eth`);

		const transaction = prepareContractCall({
			contract: registryContract,
			method: "function setContenthash(bytes32 node, bytes contenthash)",
			params: [node, contentHashBytes],
		});

		const result = await sendTransaction({
			transaction,
			account,
		});

		await waitForReceipt({
			client: thirdwebClient,
			chain: base,
			transactionHash: result.transactionHash,
		});
	};

	const setAllowedCallers = async (account: Account) => {
		const registryContract = getContract({
			client: thirdwebClient,
			chain: base,
			address: env.ENS_BASE_REGISTRY_CONTRACT_ADDRESS,
		});

		const node = namehash(`${formData.identifier}.elara-app.eth`);
		const allowedAddresses = getAllAuthorizedAddresses();
		const allowedCallersData = JSON.stringify(allowedAddresses);

		const transaction = prepareContractCall({
			contract: registryContract,
			method: "function setText(bytes32 node, string key, string value)",
			params: [node, "allowed_callers", allowedCallersData],
		});

		const result = await sendTransaction({
			transaction,
			account,
		});

		await waitForReceipt({
			client: thirdwebClient,
			chain: base,
			transactionHash: result.transactionHash,
		});
	};

	const setAvatar = async (account: Account) => {
		if (!formData.profilePicture) return;

		// Upload image to backend (IPFS via Pinata)
		const uploadResponse = await uploadFileUploadPost({
			body: { file: formData.profilePicture }
		});

		const imageUrl = (uploadResponse.data as any).ipfs_url;

		// Set avatar in ENS registry
		const registryContract = getContract({
			client: thirdwebClient,
			chain: base,
			address: env.ENS_BASE_REGISTRY_CONTRACT_ADDRESS,
		});

		const node = namehash(`${formData.identifier}.elara-app.eth`);

		const transaction = prepareContractCall({
			contract: registryContract,
			method: "function setText(bytes32 node, string key, string value)",
			params: [node, "avatar", imageUrl],
		});

		const result = await sendTransaction({
			transaction,
			account,
		});

		await waitForReceipt({
			client: thirdwebClient,
			chain: base,
			transactionHash: result.transactionHash,
		});
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
										<p className="text-sm text-red-600">✗ {ensValidation.error}</p>
									)}
									{ensValidation?.valid && ensAvailability && (
										<p className={`text-sm ${ensAvailability.available ? "text-green-600" : "text-red-600"}`}>
											{ensAvailability.available
												? `✓ ${formData.identifier} is available`
												: `✗ ${ensAvailability.error || `${formData.identifier} is not available`}`}
										</p>
									)}
									<div className="text-xs text-muted-foreground mt-1">
										Name requirements: {ENS_CONFIG.OPTIONS.MIN_NAME_LENGTH}-{ENS_CONFIG.OPTIONS.MAX_NAME_LENGTH}{" "}
										characters, alphanumeric and hyphens only.
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
											onClick={() => document.getElementById("profilePicture")?.click()}
											className="flex items-center gap-2"
										>
											<Upload className="h-4 w-4" />
											{formData.profilePicture ? "Change Picture" : "Upload Picture"}
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
										<div
											key={index}
											className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
										>
											<div className="flex-1">
												<Input
													placeholder="Variable name (e.g., API_KEY)"
													value={envVar.key}
													onChange={(e) => updateEnvVar(index, "key", e.target.value)}
													className="bg-white dark:bg-gray-700"
												/>
											</div>
											<div className="flex-1">
												<Input
													placeholder="Variable value"
													type="password"
													value={envVar.value}
													onChange={(e) => updateEnvVar(index, "value", e.target.value)}
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

							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<Label className="text-base font-medium">Authorized Addresses</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={addAuthorizedAddress}
										className="flex items-center gap-1"
									>
										<Plus className="h-4 w-4" />
										Add Address
									</Button>
								</div>
								<p className="text-sm text-muted-foreground">
									Specify which addresses can call this agent. Your wallet address is always included and cannot be
									removed.
								</p>
								<div className="space-y-3">
									{/* User's wallet address (always included, cannot be removed) */}
									<div className="flex items-center gap-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
										<div className="flex-1">
											<Input
												placeholder="Your wallet address"
												value={address || ""}
												disabled
												className="bg-white dark:bg-gray-700 font-mono text-sm"
											/>
										</div>
										<div className="flex items-center gap-2 text-xs text-muted-foreground">
											<Shield className="h-3 w-3" />
											Owner
										</div>
									</div>
									{/* Additional authorized addresses */}
									{authorizedAddresses.map((addr, index) => (
										<div
											key={index}
											className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
										>
											<div className="flex-1">
												<Input
													placeholder="0x1234567890abcdef1234567890abcdef12345678"
													value={addr}
													onChange={(e) => updateAuthorizedAddress(index, e.target.value)}
													className="bg-white dark:bg-gray-700 font-mono text-sm"
												/>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeAuthorizedAddress(index)}
												className="p-2"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									))}
									{authorizedAddresses.length === 0 && (
										<p className="text-sm text-muted-foreground italic text-center py-4">
											No additional authorized addresses. Click "Add Address" to allow other addresses to call your
											agent.
										</p>
									)}
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

								{/* Deployment Steps */}
								{deploymentStep === "form" && (
									<Button type="submit" className="w-full" size="lg" disabled={isDeploying}>
										{isDeploying ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Creating Agent Wallet...
											</>
										) : (
											"Deploy AI Agent"
										)}
									</Button>
								)}

								{deploymentStep === "signing" && (
									<div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
										<div className="flex items-center gap-3 mb-4">
											<Loader2 className="h-5 w-5 animate-spin text-blue-600" />
											<h3 className="font-semibold text-blue-900 dark:text-blue-100">Signing Message</h3>
										</div>
										<p className="text-sm text-blue-800 dark:text-blue-200">
											Please sign the message in your wallet to create the agent wallet. This signature will be used to
											generate a unique private key for your agent.
										</p>
									</div>
								)}

								{deploymentStep === "funding" && agentWallet && (
									<div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
										<div className="flex items-center gap-3 mb-4">
											<Wallet className="h-5 w-5 text-orange-600" />
											<h3 className="font-semibold text-orange-900 dark:text-orange-100">Fund Agent Wallet</h3>
										</div>
										<p className="text-sm text-orange-800 dark:text-orange-200 mb-4">
											Your agent wallet has been created! Please send some ETH to this address on Base network to pay
											for deployment transaction fees.
										</p>
										<div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
											<div className="flex items-center gap-2 mb-2">
												<Label className="text-sm font-medium">Agent Wallet Address:</Label>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => copyToClipboard(agentWallet.address)}
													className="h-6 w-6 p-0"
												>
													<Copy className="h-3 w-3" />
												</Button>
											</div>
											<div className="font-mono text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded break-all">
												{agentWallet.address}
											</div>
											<div className="flex items-center gap-2 mt-3">
												<Label className="text-sm font-medium">Current Balance:</Label>
												<span className="font-mono text-sm">{walletBalance} ETH</span>
												{isCheckingBalance && <Loader2 className="h-3 w-3 animate-spin" />}
											</div>
										</div>
										<div className="flex items-center gap-2 mt-4 text-sm text-orange-700 dark:text-orange-300">
											<AlertCircle className="h-4 w-4" />
											<span>Minimum 0.0001 ETH required. We're monitoring the balance automatically.</span>
										</div>
									</div>
								)}

								{deploymentStep === "registering" && (
									<div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
										<div className="flex items-center gap-3 mb-4">
											<Loader2 className="h-5 w-5 animate-spin text-purple-600" />
											<h3 className="font-semibold text-purple-900 dark:text-purple-100">
												Registering ENS & Setting Records
											</h3>
										</div>
										<p className="text-sm text-purple-800 dark:text-purple-200 mb-4">
											Registering your ENS name and configuring records on Base network...
										</p>
										<div className="space-y-2">
											<div className="flex items-center gap-2 text-sm">
												{registrationProgress.ensRegistered === "completed" ? (
													<CheckCircle className="h-4 w-4 text-green-500" />
												) : registrationProgress.ensRegistered === "loading" ? (
													<Loader2 className="h-4 w-4 animate-spin text-purple-600" />
												) : (
													<div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
												)}
												<span
													className={
														registrationProgress.ensRegistered === "completed"
															? "text-green-700 dark:text-green-300"
															: registrationProgress.ensRegistered === "loading"
																? "text-purple-700 dark:text-purple-300"
																: "text-gray-600 dark:text-gray-400"
													}
												>
													Register ENS name: {formData.identifier}.elara-app.eth
												</span>
											</div>
											<div className="flex items-center gap-2 text-sm">
												{registrationProgress.contentHashSet === "completed" ? (
													<CheckCircle className="h-4 w-4 text-green-500" />
												) : registrationProgress.contentHashSet === "loading" ? (
													<Loader2 className="h-4 w-4 animate-spin text-purple-600" />
												) : (
													<div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
												)}
												<span
													className={
														registrationProgress.contentHashSet === "completed"
															? "text-green-700 dark:text-green-300"
															: registrationProgress.contentHashSet === "loading"
																? "text-purple-700 dark:text-purple-300"
																: "text-gray-600 dark:text-gray-400"
													}
												>
													Set content hash
												</span>
											</div>
											<div className="flex items-center gap-2 text-sm">
												{registrationProgress.allowedCallersSet === "completed" ? (
													<CheckCircle className="h-4 w-4 text-green-500" />
												) : registrationProgress.allowedCallersSet === "loading" ? (
													<Loader2 className="h-4 w-4 animate-spin text-purple-600" />
												) : (
													<div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
												)}
												<span
													className={
														registrationProgress.allowedCallersSet === "completed"
															? "text-green-700 dark:text-green-300"
															: registrationProgress.allowedCallersSet === "loading"
																? "text-purple-700 dark:text-purple-300"
																: "text-gray-600 dark:text-gray-400"
													}
												>
													Set allowed callers record
												</span>
											</div>
											{formData.profilePicture && (
												<div className="flex items-center gap-2 text-sm">
													{registrationProgress.avatarSet === "completed" ? (
														<CheckCircle className="h-4 w-4 text-green-500" />
													) : registrationProgress.avatarSet === "loading" ? (
														<Loader2 className="h-4 w-4 animate-spin text-purple-600" />
													) : (
														<div className="h-4 w-4 rounded-full border-2 border-gray-300"></div>
													)}
													<span
														className={
															registrationProgress.avatarSet === "completed"
																? "text-green-700 dark:text-green-300"
																: registrationProgress.avatarSet === "loading"
																	? "text-purple-700 dark:text-purple-300"
																	: "text-gray-600 dark:text-gray-400"
														}
													>
														Set avatar image
													</span>
												</div>
											)}
										</div>
									</div>
								)}

								{deploymentStep === "deployed" && (
									<div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
										<div className="flex items-center gap-3 mb-4">
											<CheckCircle className="h-5 w-5 text-green-600" />
											<h3 className="font-semibold text-green-900 dark:text-green-100">Ready for Deployment</h3>
										</div>
										<p className="text-sm text-green-800 dark:text-green-200 mb-4">
											Your agent wallet has been funded successfully! The deployment process will continue in the
											background.
										</p>
										<div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
											<div className="flex items-center gap-2 mb-2">
												<Label className="text-sm font-medium">Agent Wallet:</Label>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => copyToClipboard(agentWallet?.address || "")}
													className="h-6 w-6 p-0"
												>
													<Copy className="h-3 w-3" />
												</Button>
											</div>
											<div className="font-mono text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded break-all">
												{agentWallet?.address}
											</div>
											<div className="flex items-center gap-2 mt-3">
												<Label className="text-sm font-medium">Balance:</Label>
												<span className="font-mono text-sm">{walletBalance} ETH</span>
											</div>
										</div>
										<p className="text-sm text-muted-foreground mt-4">
											This is a mock implementation. In production, the backend deployment would begin now.
										</p>
									</div>
								)}
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
