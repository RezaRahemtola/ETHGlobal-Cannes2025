import { create } from "zustand";

export interface WalletState {
	address: string | null;
	isConnected: boolean;
	connect: (address: string) => void;
	disconnect: () => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
	address: null,
	isConnected: false,
	connect: (address: string) => set({ address, isConnected: true }),
	disconnect: () => set({ address: null, isConnected: false }),
}));
