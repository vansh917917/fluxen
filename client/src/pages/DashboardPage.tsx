import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Task, FilterStatus, PriorityLevel, SortOption, TaskStats } from '../types';
import { api } from '../services/api';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { QuickAddBar } from '../components/QuickAddBar';
import { Toast, type ToastMessage } from '../components/Toast';
import { ShortcutsModal } from '../components/ShortcutsModal';
import {
  Plus,
  Search,
  CheckCircle2,
  ListTodo,
  AlertCircle,
  RefreshCw,
  Download,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  X,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [searchQuery, setSearchQuery] = useState('');

  // UI state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCompletedGroup, setShowCompletedGroup] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Refs for keyboard shortcuts
  const quickAddInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Toast helpers
  const addToast = (
    type: 'success' | 'error' | 'info',
    text: string,
    onUndo?: () => void
  ) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: ToastMessage = { id, type, text, onUndo };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all tasks and stats
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tasksRes, statsRes] = await Promise.all([
        api.tasks.getAll({
          status: filter !== 'all' ? filter : undefined,
          priority: priorityFilter !== 'all' ? priorityFilter : undefined,
          tag: tagFilter || undefined,
          sort: sortBy,
        }),
        api.tasks.getStats().catch(() => null),
      ]);
      setTasks(tasksRes.tasks);
      if (statsRes) setStats(statsRes);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load tasks');
      }
    } finally {
      setLoading(false);
    }
  }, [filter, priorityFilter, tagFilter, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Extract unique active tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    tasks.forEach((t) => {
      if (t.tag) tagsSet.add(t.tag);
    });
    return Array.from(tagsSet);
  }, [tasks]);

  // Filtered & Searched tasks in memory
  const displayedTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q) ?? false;
        const matchesTag = task.tag?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesTag) return false;
      }
      return true;
    });
  }, [tasks, searchQuery]);

  // Separate active vs completed
  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending = displayedTasks.filter((t) => !t.completed);
    const completed = displayedTasks.filter((t) => t.completed);
    return { pendingTasks: pending, completedTasks: completed };
  }, [displayedTasks]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement;

      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.key === 'n' || e.key === 'N') && !isInput) {
        e.preventDefault();
        quickAddInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setIsModalOpen(false);
        setShowShortcuts(false);
        if (isInput) (activeEl as HTMLElement).blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleQuickAdd = async (data: {
    title: string;
    priority: PriorityLevel;
    tag?: string;
  }) => {
    try {
      const res = await api.tasks.create(data);
      setTasks((prev) => [res.task, ...prev]);
      addToast('success', `Created "${res.task.title}"`);
      // Refresh stats
      api.tasks.getStats().then((s) => setStats(s)).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      addToast('error', msg);
    }
  };

  const handleCreateOrUpdateModal = async (data: {
    title: string;
    description?: string;
    priority?: PriorityLevel;
    dueDate?: string | null;
    tag?: string;
  }) => {
    if (editingTask) {
      const res = await api.tasks.update(editingTask.id, data);
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? res.task : t))
      );
      addToast('success', 'Task updated');
    } else {
      const res = await api.tasks.create(data);
      setTasks((prev) => [res.task, ...prev]);
      addToast('success', 'Task created');
    }
    api.tasks.getStats().then((s) => setStats(s)).catch(() => {});
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );

    try {
      await api.tasks.update(id, { completed });
      api.tasks.getStats().then((s) => setStats(s)).catch(() => {});
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
      );
      addToast('error', 'Failed to update task status');
    }
  };

  const handleDeleteWithUndo = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    // Optimistically remove
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await api.tasks.delete(id);
      api.tasks.getStats().then((s) => setStats(s)).catch(() => {});

      // Offer Undo by recreating the task if clicked
      addToast('info', `Deleted "${taskToDelete.title}"`, async () => {
        try {
          const restored = await api.tasks.create({
            title: taskToDelete.title,
            description: taskToDelete.description || undefined,
            priority: taskToDelete.priority,
            dueDate: taskToDelete.dueDate,
            tag: taskToDelete.tag || undefined,
          });
          setTasks((prev) => [restored.task, ...prev]);
          addToast('success', 'Task restored');
          api.tasks.getStats().then((s) => setStats(s)).catch(() => {});
        } catch {
          addToast('error', 'Could not restore task');
        }
      });
    } catch {
      setTasks((prev) => [taskToDelete, ...prev]);
      addToast('error', 'Failed to delete task');
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      if (format === 'csv') {
        const blob = (await api.tasks.exportData('csv')) as Blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fluxen_tasks_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const data = await api.tasks.exportData('json');
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fluxen_tasks_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      addToast('success', `Exported tasks as ${format.toUpperCase()}`);
    } catch {
      addToast('error', 'Export failed');
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Tasks
            </h1>
            <button
              onClick={() => setShowShortcuts(true)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Keep your priorities clear, focused, and organized.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="inline-flex rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs">
            <button
              onClick={() => handleExport('csv')}
              className="px-2.5 py-1.5 hover:bg-slate-50 flex items-center gap-1 border-r border-slate-200"
              title="Export as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              className="px-2.5 py-1.5 hover:bg-slate-50"
              title="Export as JSON"
            >
              JSON
            </button>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-6">
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ListTodo className="w-3.5 h-3.5 text-slate-700" />
            <span>Pending Tasks</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {stats ? stats.pending : tasks.filter((t) => !t.completed).length}
          </p>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Done Today</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {stats ? stats.completedToday : 0}
          </p>
        </div>

        <div
          onClick={() => {
            setFilter('pending');
            setPriorityFilter('urgent');
          }}
          className="p-3 bg-white hover:bg-rose-50/50 rounded-lg border border-slate-200 cursor-pointer shadow-2xs transition-colors"
          title="Click to filter urgent tasks"
        >
          <div className="flex items-center gap-1.5 text-[11px] text-rose-700 font-medium">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Urgent</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {stats ? stats.urgent : tasks.filter((t) => t.priority === 'urgent' && !t.completed).length}
          </p>
        </div>

        <div
          onClick={() => {
            setFilter('pending');
            setSortBy('dueDate');
          }}
          className="p-3 bg-white hover:bg-amber-50/50 rounded-lg border border-slate-200 cursor-pointer shadow-2xs transition-colors"
          title="Click to sort by due date"
        >
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Overdue</span>
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {stats ? stats.overdue : 0}
          </p>
        </div>
      </div>

      {/* Quick-Add Bar */}
      <div className="mb-6">
        <QuickAddBar onAdd={handleQuickAdd} inputRef={quickAddInputRef} />
      </div>

      {/* Filters and Search Bar */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === 'pending'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filter === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks... (Press '/')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-8 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Row: Priority & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Priority:</span>
            {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize border transition-colors ${
                  priorityFilter === p
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}

            {tagFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-900 text-white font-medium ml-2">
                #{tagFilter}
                <button
                  onClick={() => setTagFilter(null)}
                  className="hover:text-rose-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="createdAt">Newest First</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        {/* Active Tag Pills if any */}
        {availableTags.length > 0 && !tagFilter && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400">Tags:</span>
            {availableTags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Task List Area */}
      {error && (
        <div className="p-4 mb-6 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between gap-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
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
        <div className="space-y-6">
          {/* Active / Pending Tasks Group */}
          {pendingTasks.length > 0 && (
            <div className="space-y-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-1">
                Active Tasks ({pendingTasks.length})
              </h2>
              <div className="space-y-2.5">
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggleComplete={handleToggleComplete}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsModalOpen(true);
                    }}
                    onDelete={handleDeleteWithUndo}
                    onTagClick={(t) => setTagFilter(t)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks Group (Collapsible) */}
          {completedTasks.length > 0 && filter !== 'pending' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCompletedGroup((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2.5 px-1"
              >
                {showCompletedGroup ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>Completed Tasks ({completedTasks.length})</span>
              </button>

              {showCompletedGroup && (
                <div className="space-y-2.5">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onEdit={(t) => {
                        setEditingTask(t);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDeleteWithUndo}
                      onTagClick={(t) => setTagFilter(t)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
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
                Use the quick add bar above or press 'N' to create your first task.
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                No matching tasks found
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                No tasks match your current filters.
              </p>
              <button
                onClick={() => {
                  setFilter('all');
                  setPriorityFilter('all');
                  setTagFilter(null);
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-semibold text-slate-900 hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateModal}
        initialTask={editingTask}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Floating Undo Toast */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
