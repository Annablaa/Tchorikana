import { useEffect, useRef, useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { SearchDialog } from "@/components/chat/SearchDialog";
import { TaskPanel } from "@/components/chat/TaskPanel";
import { ConversationsSidebar } from "@/components/chat/ConversationsSidebar";
import { useChatDemo } from "@/hooks/useChatDemo";

/**
 * Main chat interface page.
 * Demonstrates the AI agent's semantic search and task management capabilities.
 * Features a Messenger/Slack-style layout with sidebar for conversations.
 */
const Index = () => {
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversationId,
    messages, 
    allMessages,
    tasks, 
    isTyping,
    isLoading,
    error,
    addMessage, 
    confirmTask, 
    rejectTask 
  } = useChatDemo();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Panel states
  const [searchOpen, setSearchOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  // Get active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Count pending tasks for badge
  const pendingTaskCount = tasks.filter((t) => t.status === "pending").length;

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle search from dialog
  const handleSearch = (query: string) => {
    addMessage(`@ai search for: ${query}`);
  };

  // Scroll to and highlight a specific message
  const scrollToMessage = (messageId: string, conversationId?: string) => {
    // Switch conversation if needed
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversationId(conversationId);
      // Wait for conversation switch before scrolling
      setTimeout(() => {
        setHighlightedMessageId(messageId);
        const element = document.getElementById(`message-${messageId}`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setHighlightedMessageId(null), 3000);
      }, 100);
    } else {
      setHighlightedMessageId(messageId);
      const element = document.getElementById(`message-${messageId}`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => setHighlightedMessageId(null), 3000);
    }
  };

  return (
    <div className="flex h-screen bg-chat-bg">
      {/* Left Sidebar */}
      <ConversationsSidebar
        conversations={conversations}
        activeConversationId={activeConversationId || ''}
        onConversationClick={setActiveConversationId}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header with interactive capabilities */}
        <ChatHeader 
          channelName={activeConversation?.name || "Chat"} 
          participantCount={5}
          onSearchClick={() => setSearchOpen(true)}
          onTasksClick={() => setTasksOpen(true)}
          pendingTaskCount={pendingTaskCount}
        />

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto chat-scroll">
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-destructive p-4">
                <p className="font-semibold mb-2">Error loading data</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'Failed to connect to backend'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure your backend is running at {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Loading conversations...</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No messages yet. Start a conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onConfirmTask={confirmTask}
                    onRejectTask={rejectTask}
                    highlighted={highlightedMessageId === message.id}
                    onReferenceClick={scrollToMessage}
                  />
                ))
              )}
              {isTyping && <TypingIndicator />}
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input area */}
        <ChatInput onSend={addMessage} disabled={isTyping} />
      </div>

      {/* Search dialog */}
      <SearchDialog 
        open={searchOpen} 
        onOpenChange={setSearchOpen}
        onSearch={handleSearch}
        allMessages={allMessages}
        conversations={conversations}
        onResultClick={(messageId, conversationId) => scrollToMessage(messageId, conversationId)}
      />

      {/* Task panel */}
      <TaskPanel 
        open={tasksOpen} 
        onOpenChange={setTasksOpen}
        tasks={tasks}
      />
    </div>
  );
};

export default Index;
