import { useState, useRef, useEffect } from "react";
import { Send, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * Chat input component with @ai mention support.
 * Auto-resizes based on content and supports Enter to send.
 */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertAiMention = () => {
    const cursorPosition = textareaRef.current?.selectionStart || value.length;
    const before = value.slice(0, cursorPosition);
    const after = value.slice(cursorPosition);
    const mention = "@ai ";
    setValue(before + mention + after);
    
    // Focus and move cursor after mention
    setTimeout(() => {
      textareaRef.current?.focus();
      const newPosition = cursorPosition + mention.length;
      textareaRef.current?.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  return (
    <div className="border-t border-border bg-card p-4">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* @ai mention button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-primary"
          onClick={insertAiMention}
          title="Mention AI Agent"
        >
          <AtSign className="h-5 w-5" />
        </Button>

        {/* Input area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... Use @ai to mention the AI agent"
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm 
                       placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring 
                       focus:ring-offset-1 disabled:opacity-50"
          />
        </div>

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center mt-2">
        Press <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> to send, 
        <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] ml-1">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}
