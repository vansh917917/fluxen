export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

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
  priority: PriorityLevel;
  dueDate: string | null;
  tag: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FilterStatus = 'all' | 'pending' | 'completed';
export type SortOption = 'createdAt' | 'dueDate' | 'priority';

export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  completedToday: number;
  overdue: number;
  urgent: number;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface ApiError {
  error: string;
}
