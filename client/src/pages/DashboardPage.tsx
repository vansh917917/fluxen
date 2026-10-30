import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Task, FilterStatus } from '../types';
import { api } from '../services/api';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ListTodo,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.tasks.getAll();
      setTasks(res.tasks);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Task Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  // Filtered & Searched Tasks
  const displayedTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Filter status
      if (filter === 'pending' && task.completed) return false;
      if (filter === 'completed' && !task.completed) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc =
          task.description?.toLowerCase().includes(query) ?? false;
        return matchesTitle || matchesDesc;
      }

      return true;
    });
  }, [tasks, filter, searchQuery]);

  // Handlers
  const handleCreateOrUpdate = async (data: {
    title: string;
    description?: string;
  }) => {
    if (editingTask) {
      const res = await api.tasks.update(editingTask.id, data);
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? res.task : t))
      );
    } else {
      const res = await api.tasks.create(data);
      setTasks((prev) => [res.task, ...prev]);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );

    try {
      await api.tasks.update(id, { completed });
    } catch (err) {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
      );
      alert('Failed to update task completion state');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    await api.tasks.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="py-8 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Personal Tasks
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage your daily priorities, updates, and completion status.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 my-6">
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ListTodo className="w-3.5 h-3.5 text-slate-700" />
            <span>Total Tasks</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Pending</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.pending}</p>
        </div>

        <div className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {stats.completed}
          </p>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Status Filters */}
        <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'pending'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'completed'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({stats.completed})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>
      </div>

      {/* Main Task List Area */}
      {error && (
        <div className="p-4 mb-6 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTasks}
            className="inline-flex items-center gap-1 font-semibold text-rose-900 hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-lg border border-slate-200 animate-pulse flex items-start gap-3"
            >
              <div className="w-5 h-5 bg-slate-200 rounded mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedTasks.length > 0 ? (
        <div className="space-y-3">
          {displayedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onEdit={handleOpenEditModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty states */
        <div className="p-12 text-center bg-white rounded-lg border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ListTodo className="w-6 h-6" />
          </div>
          {tasks.length === 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                No tasks yet
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                Create your first task to start organizing your work and tracking progress.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Task</span>
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                No matching tasks found
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                No tasks match your current filter or search criteria.
              </p>
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-semibold text-slate-900 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialTask={editingTask}
      />
    </div>
  );
};
