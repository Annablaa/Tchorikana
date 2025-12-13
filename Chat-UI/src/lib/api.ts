// API Base URL - can be overridden with environment variable
// Always use the full backend URL to make direct requests
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://choricana-a5jy.vercel.app';

// Backend API Types
export interface BackendUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  created_at?: string;
}

export interface BackendConversation {
  id: string;
  name: string;
  type: "channel" | "person";
  avatar_url?: string | null;
  created_at?: string;
}

export interface BackendMessage {
  id: string;
  conversation_id: string;
  author_id: string;
  content: string;
  is_ai: boolean;
  task_proposal?: Record<string, unknown> | null;
  search_result?: Record<string, unknown> | null;
  created_at?: string;
}

export interface BackendTask {
  id: string;
  message_id?: string | null;
  task_id?: string | null;
  action: "create" | "update" | "comment";
  summary: string;
  details?: string | null;
  status: "pending" | "confirmed" | "rejected";
  proposed_by: string;
  created_at?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;  // Changed from optional to required since API always returns it
  count?: number;
  message?: string;
}

export interface HealthResponse {
  status: string;
  message: string;
  timestamp: string;
}

// API Client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { message: errorText || `HTTP error! status: ${response.status}` };
        }
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Empty response from server');
      }

      try {
        return JSON.parse(responseText) as T;
      } catch (parseError) {
        console.error(`Failed to parse JSON response from ${endpoint}:`, responseText);
        throw new Error(`Invalid JSON response from server: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Unknown error: ${String(error)}`);
    }
  }

  // Health & Testing
  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health');
  }

  async testConnection(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('/api/test');
  }

  // Users
  async getUsers(params?: { id?: string; username?: string; email?: string }): Promise<ApiResponse<BackendUser[]>> {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.username) queryParams.append('username', params.username);
    if (params?.email) queryParams.append('email', params.email);
    
    const query = queryParams.toString();
    return this.request<ApiResponse<BackendUser[]>>(`/api/users${query ? `?${query}` : ''}`);
  }

  async createUser(user: {
    username: string;
    email: string;
    display_name: string;
    avatar_url?: string | null;
  }): Promise<{ message: string; data: BackendUser }> {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(user: {
    id: string;
    username?: string;
    email?: string;
    display_name?: string;
    avatar_url?: string | null;
  }): Promise<{ message: string; data: BackendUser }> {
    return this.request('/api/users', {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request(`/api/users?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Conversations
  async getConversations(params?: { id?: string; type?: "channel" | "person" }): Promise<ApiResponse<BackendConversation[]>> {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.type) queryParams.append('type', params.type);
    
    const query = queryParams.toString();
    return this.request<ApiResponse<BackendConversation[]>>(`/api/conversations${query ? `?${query}` : ''}`);
  }

  async createConversation(conversation: {
    name: string;
    type: "channel" | "person";
    avatar_url?: string | null;
  }): Promise<{ message: string; data: BackendConversation }> {
    return this.request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(conversation),
    });
  }

  async updateConversation(conversation: {
    id: string;
    name?: string;
    type?: "channel" | "person";
    avatar_url?: string | null;
  }): Promise<{ message: string; data: BackendConversation }> {
    return this.request('/api/conversations', {
      method: 'PUT',
      body: JSON.stringify(conversation),
    });
  }

  async deleteConversation(id: string): Promise<{ message: string }> {
    return this.request(`/api/conversations?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Messages
  async getMessages(params?: { id?: string; conversation_id?: string; author_id?: string }): Promise<ApiResponse<BackendMessage[]>> {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.conversation_id) queryParams.append('conversation_id', params.conversation_id);
    if (params?.author_id) queryParams.append('author_id', params.author_id);
    
    const query = queryParams.toString();
    return this.request<ApiResponse<BackendMessage[]>>(`/api/messages${query ? `?${query}` : ''}`);
  }

  async createMessage(message: {
    conversation_id: string;
    author_id: string;
    content: string;
    is_ai?: boolean;
    task_proposal?: Record<string, unknown> | null;
    search_result?: Record<string, unknown> | null;
  }): Promise<{ message: string; data: BackendMessage }> {
    return this.request('/api/messages', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async updateMessage(message: {
    id: string;
    conversation_id?: string;
    author_id?: string;
    content?: string;
    is_ai?: boolean;
    task_proposal?: Record<string, unknown> | null;
    search_result?: Record<string, unknown> | null;
  }): Promise<{ message: string; data: BackendMessage }> {
    return this.request('/api/messages', {
      method: 'PUT',
      body: JSON.stringify(message),
    });
  }

  async deleteMessage(id: string): Promise<{ message: string }> {
    return this.request(`/api/messages?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks(params?: { id?: string; status?: "pending" | "confirmed" | "rejected"; proposed_by?: string; message_id?: string }): Promise<ApiResponse<BackendTask[]>> {
    const queryParams = new URLSearchParams();
    if (params?.id) queryParams.append('id', params.id);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.proposed_by) queryParams.append('proposed_by', params.proposed_by);
    if (params?.message_id) queryParams.append('message_id', params.message_id);
    
    const query = queryParams.toString();
    return this.request<ApiResponse<BackendTask[]>>(`/api/tasks${query ? `?${query}` : ''}`);
  }

  async createTask(task: {
    message_id?: string | null;
    task_id?: string | null;
    action: "create" | "update" | "comment";
    summary: string;
    details?: string | null;
    status?: "pending" | "confirmed" | "rejected";
    proposed_by: string;
  }): Promise<{ message: string; data: BackendTask }> {
    return this.request('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(task: {
    id: string;
    message_id?: string | null;
    task_id?: string | null;
    action?: "create" | "update" | "comment";
    summary?: string;
    details?: string | null;
    status?: "pending" | "confirmed" | "rejected";
    proposed_by?: string;
  }): Promise<{ message: string; data: BackendTask }> {
    return this.request('/api/tasks', {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  }

  async deleteTask(id: string): Promise<{ message: string }> {
    return this.request(`/api/tasks?id=${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient(API_BASE_URL);

