import { useWalletStore } from "@/stores/wallet";
import { useEffect } from "react";
import { useActiveAccount, useActiveWallet } from "thirdweb/react";
import { toast } from "sonner";

export const WalletSync = () => {
	const account = useActiveAccount();
	const wallet = useActiveWallet();
	const { connect, disconnect } = useWalletStore();

	useEffect(() => {
		console.log("heu");
		toast.error("Please connect your wallet to access this page");
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
