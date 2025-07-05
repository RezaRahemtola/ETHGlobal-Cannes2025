import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThirdwebProvider } from "thirdweb/react";
import { WalletSync } from "@/components/wallet-sync";

export const Route = createRootRoute({
	component: () => (
		<ThirdwebProvider>
			<WalletSync />
			<Outlet />
		</ThirdwebProvider>
	),
});
