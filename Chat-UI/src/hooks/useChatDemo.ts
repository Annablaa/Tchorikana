import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Message } from "@/components/chat/ChatMessage";
import { Task } from "@/components/chat/TaskPanel";
import { api, BackendUser, BackendConversation, BackendMessage, BackendTask } from "@/lib/api";

export interface Conversation {
  id: string;
  name: string;
  type: "person" | "channel";
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

// Demo user IDs - hardcoded for demo purposes to avoid foreign key constraint errors
// In production, this would come from authentication
const DEMO_USER_IDS = {
  DEV: 'u_dev_001',
  PM: 'u_pm_001',
} as const;

/**
 * Hook that connects to the backend API for conversations, messages, and tasks.
 * Replaces the previous demo hook with real API integration.
 */
export function useChatDemo() {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  // Track message count per conversation to alternate between demo users
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading, error: conversationsError } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const response = await api.getConversations();
      // API always returns data as an array, but we check for safety
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
    retry: 2,
  });

  // Fetch users for mapping author_id to display names
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.getUsers();
      return response.data || [];
    },
  });

  // Create user map for quick lookups
  const userMap = useMemo(() => {
    const map = new Map<string, BackendUser>();
    if (usersData) {
      usersData.forEach(user => map.set(user.id, user));
    }
    return map;
  }, [usersData]);

  // Set active conversation to first one when conversations load
  useEffect(() => {
    if (conversationsData && conversationsData.length > 0 && !activeConversationId) {
      setActiveConversationId(conversationsData[0].id);
    }
  }, [conversationsData, activeConversationId]);

  // Fetch messages for active conversation
  const { data: messagesData, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: async () => {
      if (!activeConversationId) return [];
      const response = await api.getMessages({ conversation_id: activeConversationId });
      const messages = response.data || [];
      // Sort messages by created_at (oldest first)
      return messages.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
    },
    enabled: !!activeConversationId,
    retry: 2,
  });

  // Fetch all messages for search functionality
  const { data: allMessagesData } = useQuery({
    queryKey: ['messages', 'all'],
    queryFn: async () => {
      const response = await api.getMessages();
      const messages = response.data || [];
      // Sort messages by created_at (oldest first)
      return messages.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      });
    },
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const response = await api.getTasks();
      return response.data || [];
    },
  });

  // Map backend message to frontend message
  const mapMessage = useCallback((backendMsg: BackendMessage): Message => {
    const author = userMap.get(backendMsg.author_id)?.display_name || 
                   userMap.get(backendMsg.author_id)?.username || 
                   'Unknown User';
    
    const timestamp = backendMsg.created_at 
      ? new Date(backendMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
      id: backendMsg.id,
      conversationId: backendMsg.conversation_id,
      author,
      timestamp,
      content: backendMsg.content,
      isAi: backendMsg.is_ai,
      taskProposal: backendMsg.task_proposal && typeof backendMsg.task_proposal === 'object' ? {
        taskId: (backendMsg.task_proposal as Record<string, unknown>).taskId as string | undefined || 
                (backendMsg.task_proposal as Record<string, unknown>).task_id as string | undefined,
        action: (() => {
          const actionValue = (backendMsg.task_proposal as Record<string, unknown>).action;
          // Validate action is one of the valid values, default to 'create' if not
          if (actionValue === 'create' || actionValue === 'update' || actionValue === 'comment') {
            return actionValue as "create" | "update" | "comment";
          }
          return "create" as const;
        })(),
        summary: (backendMsg.task_proposal as Record<string, unknown>).summary as string,
        details: ((backendMsg.task_proposal as Record<string, unknown>).details as string) || '',
        confirmed: (backendMsg.task_proposal as Record<string, unknown>).confirmed as boolean | undefined || false,
        rejected: (backendMsg.task_proposal as Record<string, unknown>).rejected as boolean | undefined || false,
      } : undefined,
      searchResult: backendMsg.search_result && typeof backendMsg.search_result === 'object' ? {
        query: (backendMsg.search_result as Record<string, unknown>).query as string,
        summary: (backendMsg.search_result as Record<string, unknown>).summary as string,
        references: ((backendMsg.search_result as Record<string, unknown>).references as Array<{
          date: string;
          participant: string;
          snippet: string;
        }>) || [],
      } : undefined,
    };
  }, [userMap]);

  // Map backend conversation to frontend conversation
  const mapConversation = useCallback((backendConv: BackendConversation, allMessages: BackendMessage[]): Conversation => {
    const convMessages = allMessages.filter(msg => msg.conversation_id === backendConv.id);
    const lastMessage = convMessages[convMessages.length - 1];
    
    return {
      id: backendConv.id,
      name: backendConv.name,
      type: backendConv.type,
      avatar: backendConv.avatar_url || undefined,
      lastMessage: lastMessage?.content.substring(0, 50) + (lastMessage?.content.length > 50 ? "..." : ""),
      lastMessageTime: lastMessage?.created_at 
        ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : undefined,
      unreadCount: 0, // Could be calculated based on read status
    };
  }, []);

  // Map backend task to frontend task
  const mapTask = useCallback((backendTask: BackendTask): Task => {
    const proposedBy = userMap.get(backendTask.proposed_by)?.display_name || 
                       userMap.get(backendTask.proposed_by)?.username || 
                       'Unknown User';
    
    const timestamp = backendTask.created_at 
      ? new Date(backendTask.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    return {
      id: backendTask.id,
      taskId: backendTask.task_id || undefined,
      action: backendTask.action,
      summary: backendTask.summary,
      details: backendTask.details || '',
      status: backendTask.status,
      timestamp,
      proposedBy,
    };
  }, [userMap]);

  // Convert backend data to frontend format
  const conversations = useMemo(() => {
    if (!conversationsData || !allMessagesData) return [];
    return conversationsData.map(conv => mapConversation(conv, allMessagesData));
  }, [conversationsData, allMessagesData, mapConversation]);

  // Initialize message counts from existing messages when they load
  useEffect(() => {
    if (allMessagesData) {
      const counts: Record<string, number> = {};
      allMessagesData.forEach(msg => {
        if (!msg.is_ai) {
          counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
        }
      });
      setMessageCounts(prev => {
        // Only update if we have new data
        const hasChanges = Object.keys(counts).some(
          key => counts[key] !== prev[key]
        );
        return hasChanges ? { ...prev, ...counts } : prev;
      });
    }
  }, [allMessagesData]);

  const activeMessages = useMemo(() => {
    if (!messagesData) return [];
    return messagesData.map(mapMessage);
  }, [messagesData, mapMessage]);

  const allMessages = useMemo(() => {
    if (!allMessagesData) return [];
    return allMessagesData.map(mapMessage);
  }, [allMessagesData, mapMessage]);

  const tasks = useMemo<Task[]>(() => {
    if (!tasksData) return [];
    return tasksData.map(mapTask);
  }, [tasksData, mapTask]);

  // Mutation for adding a message
  const addMessageMutation = useMutation({
    mutationFn: async ({ content, author, conversationId }: { content: string; author?: string; conversationId?: string }) => {
      const targetConversationId = conversationId || activeConversationId;
      if (!targetConversationId) throw new Error('No active conversation');

      // For demo: alternate between two hardcoded user IDs
      // First message uses u_dev_001, second uses u_pm_001, then alternates
      const currentCount = messageCounts[targetConversationId] || 0;
      const authorId = currentCount % 2 === 0 ? DEMO_USER_IDS.DEV : DEMO_USER_IDS.PM;
      
      // Update message count for this conversation
      setMessageCounts(prev => ({
        ...prev,
        [targetConversationId]: currentCount + 1,
      }));

      const newMessage = await api.createMessage({
        conversation_id: targetConversationId,
        author_id: authorId,
        content,
        is_ai: false,
      });

      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      // Check if message mentions AI or is a confirmation
      const lowerContent = content.toLowerCase();
      const mentionsAi = lowerContent.includes("@ai");
      const isConfirmation = /^(yes|confirm|ok|approve|do it|update)/i.test(content.trim());
      const isSearch = mentionsAi && (
        lowerContent.includes("what was") ||
        lowerContent.includes("did anyone") ||
        lowerContent.includes("when did") ||
        lowerContent.includes("find") ||
        lowerContent.includes("search")
      );

      if (mentionsAi || isConfirmation) {
        // Simulate AI response (in production, this would be handled by backend)
        simulateAiResponse(content, isSearch, isConfirmation, targetConversationId, authorId);
      }

      return newMessage;
    },
  });

  const addMessage = useCallback((content: string, author = "You", conversationId?: string) => {
    addMessageMutation.mutate({ content, author, conversationId });
  }, [addMessageMutation]);

  const simulateAiResponse = async (
    userMessage: string,
    isSearch: boolean,
    isConfirmation: boolean,
    conversationId: string,
    userId: string
  ) => {
    setIsTyping(true);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTyping(false);

    let aiMessage: Partial<BackendMessage>;

    // For AI responses, use one of the demo user IDs
    // In production, this would be a system user or handled differently
    const aiUserId = DEMO_USER_IDS.PM; // Use PM user ID for AI responses

    if (isConfirmation) {
      // Handle task confirmation - find the pending task and update it
      const pendingTasks = tasksData?.filter(t => t.status === 'pending') || [];
      if (pendingTasks.length > 0) {
        const taskToConfirm = pendingTasks[0];
        await api.updateTask({
          id: taskToConfirm.id,
          status: 'confirmed',
        });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }

      aiMessage = {
        conversation_id: conversationId,
        author_id: aiUserId,
        content: "Done! I've updated the task. The changes have been applied.",
        is_ai: true,
      };
    } else if (isSearch) {
      // Semantic search response
      // In production, this would be handled by the backend
      aiMessage = {
        conversation_id: conversationId,
        author_id: aiUserId,
        content: "I found relevant discussions about this topic. Here's what I discovered:",
        is_ai: true,
        search_result: {
          query: userMessage,
          summary: "Relevant discussions found across conversations.",
          references: [], // Would be populated by backend
        },
      };
    } else {
      // Task proposal response
      // In production, this would be handled by the backend
      const newTask = await api.createTask({
        action: "create",
        summary: "New task based on discussion",
        details: "Task details based on the conversation",
        status: "pending",
        proposed_by: aiUserId,
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });

      aiMessage = {
        conversation_id: conversationId,
        author_id: aiUserId,
        content: "Based on the discussion, I've identified an action item that should be tracked. Here's my proposal:",
        is_ai: true,
        task_proposal: {
          taskId: newTask.data.task_id || newTask.data.id,
          action: newTask.data.action,
          summary: newTask.data.summary,
          details: newTask.data.details || '',
        },
      };
    }

      await api.createMessage({
        conversation_id: aiMessage.conversation_id!,
        author_id: aiMessage.author_id!,
        content: aiMessage.content!,
        is_ai: aiMessage.is_ai!,
        task_proposal: aiMessage.task_proposal,
        search_result: aiMessage.search_result,
      });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
  };

  // Mutation for confirming a task
  const confirmTaskMutation = useMutation({
    mutationFn: async (messageId: string) => {
      // Find the task associated with this message
      const task = tasksData?.find(t => t.message_id === messageId);
      if (task) {
        await api.updateTask({
          id: task.id,
          status: 'confirmed',
        });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }

      // Update message task_proposal if it exists
      const message = allMessagesData?.find(m => m.id === messageId);
      if (message && message.task_proposal) {
        await api.updateMessage({
          id: messageId,
          task_proposal: {
            ...message.task_proposal,
            confirmed: true,
          },
        });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
    },
  });

  const confirmTask = useCallback((messageId: string) => {
    confirmTaskMutation.mutate(messageId);
  }, [confirmTaskMutation]);

  // Mutation for rejecting a task
  const rejectTaskMutation = useMutation({
    mutationFn: async (messageId: string) => {
      // Find the task associated with this message
      const task = tasksData?.find(t => t.message_id === messageId);
      if (task) {
        await api.updateTask({
          id: task.id,
          status: 'rejected',
        });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }

      // Update message task_proposal if it exists
      const message = allMessagesData?.find(m => m.id === messageId);
      if (message && message.task_proposal) {
        await api.updateMessage({
          id: messageId,
          task_proposal: {
            ...message.task_proposal,
            rejected: true,
          },
        });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      }
    },
  });

  const rejectTask = useCallback((messageId: string) => {
    rejectTaskMutation.mutate(messageId);
  }, [rejectTaskMutation]);

  return {
    conversations,
    activeConversationId: activeConversationId || '',
    setActiveConversationId,
    messages: activeMessages,
    allMessages,
    tasks,
    isTyping,
    isLoading: conversationsLoading || messagesLoading,
    error: conversationsError || messagesError,
    addMessage,
    confirmTask,
    rejectTask,
  };
}
