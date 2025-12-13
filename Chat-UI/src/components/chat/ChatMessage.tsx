import { ChatAvatar } from "./ChatAvatar";
import { TaskProposal } from "./TaskProposal";
import { SearchResult } from "./SearchResult";

interface TaskProposalData {
  taskId?: string;
  action: "create" | "update" | "comment";
  summary: string;
  details: string;
  confirmed?: boolean;
  rejected?: boolean;
}

interface SearchResultData {
  query: string;
  summary: string;
  references: {
    date: string;
    participant: string;
    snippet: string;
  }[];
}

export interface Message {
  id: string;
  conversationId: string;
  author: string;
  timestamp: string;
  content: string;
  isAi?: boolean;
  taskProposal?: TaskProposalData;
  searchResult?: SearchResultData;
}

interface ChatMessageProps {
  message: Message;
  onConfirmTask?: (messageId: string) => void;
  onRejectTask?: (messageId: string) => void;
  highlighted?: boolean;
  onReferenceClick?: (messageId: string, conversationId: string) => void;
}

/**
 * Individual chat message component.
 * Handles both human and AI messages with different visual treatments.
 * AI messages can include task proposals or search results.
 */
export function ChatMessage({ message, onConfirmTask, onRejectTask, highlighted, onReferenceClick }: ChatMessageProps) {
  const { id, author, timestamp, content, isAi, taskProposal, searchResult } = message;

  return (
    <div 
      id={`message-${id}`}
      className={`group flex gap-3 p-4 message-enter ${isAi ? "bg-chat-ai" : ""} ${
        highlighted ? "bg-primary/10 border-l-4 border-primary" : ""
      } transition-colors`}
    >
      {/* Avatar */}
      <ChatAvatar isAi={isAi} name={author} />

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header: author name and timestamp */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`font-semibold ${isAi ? "text-primary" : "text-foreground"}`}>
            {author}
          </span>
          {isAi && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-ai-soft text-primary rounded">
              AI
            </span>
          )}
          <span className="text-xs text-muted-foreground">{timestamp}</span>
        </div>

        {/* Message text */}
        <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{content}</p>

        {/* Task proposal if present */}
        {taskProposal && (
          <TaskProposal
            taskId={taskProposal.taskId}
            action={taskProposal.action}
            summary={taskProposal.summary}
            details={taskProposal.details}
            confirmed={taskProposal.confirmed}
            rejected={taskProposal.rejected}
            onConfirm={() => onConfirmTask?.(id)}
            onReject={() => onRejectTask?.(id)}
          />
        )}

        {/* Search result if present */}
        {searchResult && (
          <SearchResult
            query={searchResult.query}
            summary={searchResult.summary}
            references={searchResult.references}
            onReferenceClick={onReferenceClick}
          />
        )}
      </div>
    </div>
  );
}
