import type {
  Task,
  User,
  AuthResponse,
  FilterStatus,
  PriorityLevel,
  SortOption,
  TaskStats,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_STORAGE_KEY = 'fluxen_auth_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      data.error ||
      `Request failed with status ${response.status} (${response.statusText})`;
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  auth: {
    register: async (email: string, password: string): Promise<AuthResponse> => {
      const result = await request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (result.token) {
        setToken(result.token);
      }
      return result;
    },

    login: async (email: string, password: string): Promise<AuthResponse> => {
      const result = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (result.token) {
        setToken(result.token);
      }
      return result;
    },

    logout: async (): Promise<{ message: string }> => {
      try {
        return await request<{ message: string }>('/auth/logout', {
          method: 'POST',
        });
      } finally {
        clearToken();
      }
    },

    getMe: async (): Promise<{ user: User }> => {
      return request<{ user: User }>('/auth/me');
    },
  },

  tasks: {
    getAll: async (params?: {
      status?: FilterStatus;
      priority?: PriorityLevel;
      tag?: string;
      sort?: SortOption;
    }): Promise<{ tasks: Task[] }> => {
      const queryParams = new URLSearchParams();
      if (params?.status && params.status !== 'all') {
        queryParams.set('status', params.status);
      }
      if (params?.priority) {
        queryParams.set('priority', params.priority);
      }
      if (params?.tag) {
        queryParams.set('tag', params.tag);
      }
      if (params?.sort) {
        queryParams.set('sort', params.sort);
      }

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/tasks?${queryString}` : '/tasks';
      return request<{ tasks: Task[] }>(endpoint);
    },

    getStats: async (): Promise<TaskStats> => {
      return request<TaskStats>('/tasks/stats');
    },

    getById: async (id: string): Promise<{ task: Task }> => {
      return request<{ task: Task }>(`/tasks/${id}`);
    },

    create: async (data: {
      title: string;
      description?: string;
      priority?: PriorityLevel;
      dueDate?: string | null;
      tag?: string;
    }): Promise<{ task: Task; message: string }> => {
      return request<{ task: Task; message: string }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (
      id: string,
      data: {
        title?: string;
        description?: string | null;
        completed?: boolean;
        priority?: PriorityLevel;
        dueDate?: string | null;
        tag?: string | null;
      }
    ): Promise<{ task: Task; message: string }> => {
      return request<{ task: Task; message: string }>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string): Promise<{ message: string }> => {
      return request<{ message: string }>(`/tasks/${id}`, {
        method: 'DELETE',
      });
    },

    exportData: async (format: 'json' | 'csv'): Promise<Blob | object> => {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/tasks/export?format=${format}`, {
        credentials: 'include',
        headers,
      });

      if (!res.ok) throw new Error('Failed to export tasks');

      if (format === 'csv') {
        return res.blob();
      }
      return res.json();
    },
  },
};
