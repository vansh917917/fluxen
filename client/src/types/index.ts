export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type FilterStatus = 'all' | 'pending' | 'completed';

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface ApiError {
  error: string;
}
