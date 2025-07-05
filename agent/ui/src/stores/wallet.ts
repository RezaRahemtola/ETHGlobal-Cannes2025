import { create } from "zustand";

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  signature: string | null;
  connect: (address: string) => void;
  disconnect: () => void;
  setSignature: (signature: string) => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  address: null,
  isConnected: false,
  signature: null,
  connect: (address: string) => set({ address, isConnected: true }),
  disconnect: () => set({ address: null, isConnected: false, signature: null }),
  setSignature: (signature: string) => set({ signature }),
}));