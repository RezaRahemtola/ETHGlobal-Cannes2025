import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThirdwebProvider } from "thirdweb/react";
import { Navbar } from "@/components/navbar";
import { WalletSync } from "@/components/wallet-sync";
import { Toaster } from "@/components/ui/sonner.tsx";
import "sonner/dist/styles.css";

export const Route = createRootRoute({
	component: () => (
		<ThirdwebProvider>
			<WalletSync />
			<div className="min-h-screen bg-background">
				<Navbar />
				<Outlet />
				<Toaster />
			</div>
		</ThirdwebProvider>
	),
});
