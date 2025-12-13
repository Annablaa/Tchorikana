import { Bot, User } from "lucide-react";

interface ChatAvatarProps {
  isAi?: boolean;
  name: string;
}

/**
 * Avatar component that distinguishes between AI and human participants.
 * AI gets a distinctive blue gradient background with a bot icon.
 * Humans get a neutral gray with their initials.
 */
export function ChatAvatar({ isAi, name }: ChatAvatarProps) {
  if (isAi) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-sm">
        <Bot className="h-5 w-5 text-primary-foreground" />
      </div>
    );
  }

  // Get initials from name
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
      {initials}
    </div>
  );
}
