import { Hash, User } from "lucide-react";
import { ChatAvatar } from "./ChatAvatar";
import { Conversation } from "@/hooks/useChatDemo";
import { cn } from "@/lib/utils";

interface ConversationsSidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  onConversationClick: (conversationId: string) => void;
}

/**
 * Left sidebar showing list of conversations (people and channels).
 * Styled similar to Messenger/Slack with avatars, names, and last message preview.
 */
export function ConversationsSidebar({
  conversations,
  activeConversationId,
  onConversationClick,
}: ConversationsSidebarProps) {
  return (
    <div className="w-[280px] border-r border-border bg-sidebar-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Conversations</h2>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          
          return (
            <button
              key={conversation.id}
              onClick={() => onConversationClick(conversation.id)}
              className={cn(
                "w-full px-4 py-3 flex items-center gap-3 hover:bg-sidebar-accent transition-colors text-left",
                isActive && "bg-sidebar-accent border-l-2 border-sidebar-primary"
              )}
            >
              {/* Avatar */}
              <div className="shrink-0">
                {conversation.type === "channel" ? (
                  <div className="h-10 w-10 rounded-full bg-sidebar-primary/10 flex items-center justify-center">
                    <Hash className="h-5 w-5 text-sidebar-primary" />
                  </div>
                ) : (
                  <ChatAvatar isAi={false} name={conversation.name} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "font-medium text-sm truncate",
                    isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground"
                  )}>
                    {conversation.name}
                  </span>
                  {conversation.unreadCount > 0 && (
                    <span className="shrink-0 ml-2 h-5 w-5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs flex items-center justify-center">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
                {conversation.lastMessage && (
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {conversation.lastMessage}
                  </p>
                )}
                {conversation.lastMessageTime && (
                  <p className="text-xs text-sidebar-foreground/40 mt-0.5">
                    {conversation.lastMessageTime}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

