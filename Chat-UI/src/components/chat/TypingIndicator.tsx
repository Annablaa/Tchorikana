import { Bot } from "lucide-react";

/**
 * Animated typing indicator shown when AI is processing.
 */
export function TypingIndicator() {
  return (
    <div className="flex gap-3 p-4 bg-chat-ai message-enter">
      {/* AI Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm">
        <Bot className="h-5 w-5 text-primary-foreground" />
      </div>

      {/* Typing dots */}
      <div className="flex items-center gap-1 h-9 px-4 rounded-lg bg-chat-ai-border/50">
        <span className="h-2 w-2 rounded-full bg-primary/60 typing-dot" />
        <span className="h-2 w-2 rounded-full bg-primary/60 typing-dot" />
        <span className="h-2 w-2 rounded-full bg-primary/60 typing-dot" />
      </div>
    </div>
  );
}
