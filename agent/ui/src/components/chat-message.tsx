import { Message } from "@/types/chat";
import { Card } from "@/components/ui/card";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} mb-4`}>
      <Card className={`max-w-xs lg:max-w-md px-4 py-2 ${
        message.role === "user" 
          ? "bg-blue-500 text-white" 
          : "bg-gray-100 text-gray-800"
      }`}>
        <p className="text-sm">{message.content}</p>
      </Card>
    </div>
  );
}