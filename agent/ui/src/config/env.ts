import { z } from "zod";

const envSchema = z.object({
	THIRDWEB_CLIENT_ID: z.string(),
});

const env = envSchema.parse({
	THIRDWEB_CLIENT_ID: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

export default env;
