import { useWalletStore } from "@/stores/wallet";
import { useEffect } from "react";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";

export const WalletSync = () => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect, disconnect, address, setSignature } = useWalletStore();

  useEffect(() => {
    if (account) {
      connect(account.address);
    } else {
      disconnect();
    }
  }, [account, connect, disconnect]);

  wallet?.subscribe("accountChanged", (account) => {
    if (account) {
      // If wallet address changed, clear signature to force re-signing
      if (address && address !== account.address) {
        setSignature("");
      }
      connect(account.address);
    } else {
      disconnect();
    }
  });

  return null;
};