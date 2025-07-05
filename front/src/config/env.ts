import { z } from "zod";

const envSchema = z.object({
	BACKEND_API_URL: z.string().url(),
	THIRDWEB_CLIENT_ID: z.string(),
	ENS_CONTRACT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address"),
});

const env = envSchema.parse({
	BACKEND_API_URL: import.meta.env.VITE_BACKEND_API_URL,
	THIRDWEB_CLIENT_ID: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
	ENS_CONTRACT_ADDRESS: import.meta.env.VITE_ENS_CONTRACT_ADDRESS,
});

export default env;
