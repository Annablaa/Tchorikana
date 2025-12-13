import { Search, Calendar, User } from "lucide-react";

interface SearchReference {
  conversationId?: string;
  messageId?: string;
  date: string;
  participant: string;
  snippet: string;
  conversationName?: string;
}

interface SearchResultProps {
  query: string;
  summary: string;
  references: SearchReference[];
  onReferenceClick?: (messageId: string, conversationId: string) => void;
}

/**
 * Semantic search result card displayed within AI messages.
 * Shows a summary with referenced past conversations.
 * References can be clickable to navigate to the message.
 */
export function SearchResult({ query, summary, references, onReferenceClick }: SearchResultProps) {
  return (
    <div className="mt-3 rounded-lg border border-chat-ai-border bg-card p-4">
      {/* Query indicator */}
      <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
        <Search className="h-4 w-4" />
        <span>Searched: "{query}"</span>
      </div>

      {/* Summary */}
      <p className="text-foreground mb-4">{summary}</p>

      {/* References */}
      {references.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Referenced Conversations
          </p>
          {references.map((ref, index) => {
            const isClickable = onReferenceClick && ref.messageId && ref.conversationId;
            const Component = isClickable ? "button" : "div";
            
            return (
              <Component
                key={index}
                onClick={isClickable ? () => onReferenceClick!(ref.messageId!, ref.conversationId!) : undefined}
                className={`rounded-md bg-muted/50 p-3 text-sm text-left w-full ${
                  isClickable ? "hover:bg-muted cursor-pointer transition-colors" : ""
                }`}
              >
                {ref.conversationName && (
                  <div className="text-xs font-medium text-primary mb-1">
                    {ref.conversationName}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {ref.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {ref.participant}
                  </span>
                </div>
                <p className="text-foreground/80 italic">"{ref.snippet}"</p>
                {isClickable && (
                  <p className="text-xs text-primary mt-2">Click to view →</p>
                )}
              </Component>
            );
          })}
        </div>
      )}
    </div>
  );
}
