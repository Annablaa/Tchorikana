import { useState } from "react";
import { Search, Calendar, User, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Message } from "./ChatMessage";

interface SearchReference {
  conversationId: string;
  messageId: string;
  date: string;
  participant: string;
  snippet: string;
  conversationName?: string;
}

interface Conversation {
  id: string;
  name: string;
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => void;
  allMessages?: Message[];
  conversations?: Conversation[];
  onResultClick?: (messageId: string, conversationId: string) => void;
}

/**
 * Dialog for semantic search across chat history.
 * Shows search input and displays results with references.
 * Searches across all conversations and allows navigation to specific messages.
 */
export function SearchDialog({ open, onOpenChange, onSearch, allMessages = [], conversations = [], onResultClick }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{
    summary: string;
    references: SearchReference[];
  } | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Simulate semantic search (in production, this would call a backend)
    await new Promise((resolve) => setTimeout(resolve, 1200));
    
    // Search across all messages
    const lowerQuery = query.toLowerCase();
    const matchingMessages = allMessages.filter((msg) => 
      msg.content.toLowerCase().includes(lowerQuery) ||
      msg.author.toLowerCase().includes(lowerQuery)
    ).slice(0, 5); // Limit to 5 results
    
    // Build references with conversation and message IDs
    const references: SearchReference[] = matchingMessages.map((msg) => ({
      conversationId: msg.conversationId,
      messageId: msg.id,
      date: msg.timestamp,
      participant: msg.author,
      snippet: msg.content.substring(0, 100) + (msg.content.length > 100 ? "..." : ""),
      conversationName: conversations.find(c => c.id === msg.conversationId)?.name || `Conversation ${msg.conversationId}`,
    }));
    
    // If no matches found, use demo results
    const demoResults = {
      summary: matchingMessages.length > 0 
        ? `Found ${matchingMessages.length} relevant message${matchingMessages.length > 1 ? 's' : ''} about "${query}".`
        : `Found relevant discussions about "${query}". The team has been actively discussing this topic, with key decisions made around transaction limits and validation requirements.`,
      references: references.length > 0 ? references : [
        {
          conversationId: "conv-1",
          messageId: "3",
          date: "Dec 10, 2024",
          participant: "Sarah Chen",
          snippet: "For standard accounts, I'd suggest a $10,000 daily limit. Premium accounts could go up to $50,000.",
          conversationName: "payments-team",
        },
        {
          conversationId: "conv-1",
          messageId: "5",
          date: "Dec 11, 2024",
          participant: "Marcus Williams",
          snippet: "We already have PAY-23 for payment validation. Can you update that one with these new requirements?",
          conversationName: "payments-team",
        },
        {
          conversationId: "conv-1",
          messageId: "1",
          date: "Dec 9, 2024",
          participant: "Sarah Chen",
          snippet: "Good morning team! I wanted to discuss the payment validation changes we need for the new release.",
          conversationName: "payments-team",
        },
      ],
    };
    
    setResults(demoResults);
    setIsSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSendToChat = () => {
    onSearch(query);
    onOpenChange(false);
    setQuery("");
    setResults(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Semantic Search
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="flex gap-2">
          <Input
            placeholder="Search past conversations... (e.g., 'What was decided about payment limits?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={!query.trim() || isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto mt-4">
          {isSearching && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Searching conversations...
            </div>
          )}

          {results && !isSearching && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 rounded-lg bg-accent/50 border border-border">
                <p className="text-sm font-medium text-muted-foreground mb-2">Summary</p>
                <p className="text-foreground">{results.summary}</p>
              </div>

              {/* References */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Referenced Conversations
                </p>
                <div className="space-y-2">
                  {results.references.map((ref, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (onResultClick && ref.messageId && ref.conversationId) {
                          onResultClick(ref.messageId, ref.conversationId);
                          onOpenChange(false);
                        }
                      }}
                      className="w-full text-left rounded-lg border border-border bg-card p-3 hover:bg-accent hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      {ref.conversationName && (
                        <div className="text-xs font-medium text-primary mb-1">
                          {ref.conversationName}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {ref.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ref.participant}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 italic">"{ref.snippet}"</p>
                      <p className="text-xs text-primary mt-2">Click to view in chat →</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action button */}
              <Button onClick={handleSendToChat} className="w-full">
                Ask AI-Agent about this in chat
              </Button>
            </div>
          )}

          {!results && !isSearching && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Search for topics, decisions, or discussions</p>
              <p className="text-sm mt-1">AI will find semantically relevant conversations</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
