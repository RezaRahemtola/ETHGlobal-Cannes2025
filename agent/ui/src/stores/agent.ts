import { create } from "zustand";
import { AgentMetadata } from "@/services/api";

export interface AgentState {
  metadata: AgentMetadata | null;
  isLoading: boolean;
  setMetadata: (metadata: AgentMetadata) => void;
  setLoading: (loading: boolean) => void;
}

export const useAgentStore = create<AgentState>()((set) => ({
  metadata: null,
  isLoading: false,
  setMetadata: (metadata: AgentMetadata) => set({ metadata }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));