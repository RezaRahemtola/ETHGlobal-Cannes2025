import { useWalletStore } from "@/stores/wallet";
import { useEffect } from "react";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";

export const WalletSync = () => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect, disconnect } = useWalletStore();

  useEffect(() => {
    if (account) {
      connect(account.address);
    } else {
      disconnect();
    }
  }, [account, connect, disconnect]);

  wallet?.subscribe("accountChanged", (account) => {
    if (account) {
      connect(account.address);
    } else {
      disconnect();
    }
  });

  return null;
};