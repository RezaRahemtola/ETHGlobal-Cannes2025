import { create } from "zustand";
import { Message, ChatState } from "@/types/chat";

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (message: Message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),
}));