import { Link } from "@tanstack/react-router";
import { ConnectButton } from "thirdweb/react";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/stores/wallet";
import { thirdwebClient } from "@/config/thirdweb";

export function Navbar() {
  const { isConnected } = useWalletStore();

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold text-primary">
              AI Agent Hub
            </Link>
            <div className="flex gap-4">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              {isConnected && (
                <Link
                  to="/create-agent"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Create Agent
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ConnectButton
              client={thirdwebClient}
              onConnect={(wallet) => {
                useWalletStore.getState().connect(wallet.getAccount()?.address || "");
              }}
              onDisconnect={() => {
                useWalletStore.getState().disconnect();
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}