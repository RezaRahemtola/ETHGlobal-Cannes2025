import { Link, useRouter } from "@tanstack/react-router";
import { ConnectButton } from "thirdweb/react";
import { useWalletStore } from "@/stores/wallet";
import { thirdwebClient } from "@/config/thirdweb";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
	const router = useRouter();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false);
	};

	return (
		<nav className="border-b bg-background">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex items-center gap-8">
						<Link to="/" className="text-xl font-bold text-primary">
							Elara
						</Link>
						<div className="hidden md:flex gap-4">
							<Link
								to="/create-agent"
								className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
							>
								Create Agent
							</Link>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="hidden md:block">
							<ConnectButton
								client={thirdwebClient}
								onConnect={(wallet) => {
									useWalletStore.getState().connect(wallet.getAccount()?.address || "");
								}}
								onDisconnect={() => {
									useWalletStore.getState().disconnect();
									router.navigate({ to: "/" });
								}}
							/>
						</div>
						<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
							<SheetTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="md:hidden"
									aria-label="Toggle mobile menu"
								>
									<Menu size={24} />
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-80 pt-10">
								<SheetHeader className="text-left">
									<SheetTitle className="text-lg font-semibold">Navigation</SheetTitle>
								</SheetHeader>
								<div className="flex flex-col gap-6 mt-8">
									<Link
										to="/create-agent"
										className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-3 px-2 rounded-md hover:bg-accent"
										onClick={closeMobileMenu}
									>
										Create Agent
									</Link>
									<div className="pt-4 border-t border-border">
										<ConnectButton
											client={thirdwebClient}
											onConnect={(wallet) => {
												useWalletStore.getState().connect(wallet.getAccount()?.address || "");
												closeMobileMenu();
											}}
											onDisconnect={() => {
												useWalletStore.getState().disconnect();
												router.navigate({ to: "/" });
												closeMobileMenu();
											}}
										/>
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</div>
				</div>
			</div>
		</nav>
	);
}
