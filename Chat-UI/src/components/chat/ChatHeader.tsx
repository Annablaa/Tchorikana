import { Hash, Users, Bot, Search, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  channelName: string;
  participantCount: number;
  onSearchClick: () => void;
  onTasksClick: () => void;
  pendingTaskCount?: number;
}

/**
 * Chat header with channel info and interactive AI capabilities.
 */
export function ChatHeader({ 
  channelName, 
  participantCount, 
  onSearchClick, 
  onTasksClick,
  pendingTaskCount = 0 
}: ChatHeaderProps) {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Channel info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-lg font-semibold text-foreground">{channelName}</h1>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{participantCount} members</span>
          </div>
        </div>

        {/* AI capabilities - now interactive */}
        <div className="flex items-center gap-2">
          {/* AI Agent indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ai-soft">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-primary font-medium text-sm">AI-Agent</span>
          </div>

          {/* Semantic Search button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSearchClick}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>

          {/* Task Management button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onTasksClick}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-accent relative"
          >
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
            {pendingTaskCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {pendingTaskCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
