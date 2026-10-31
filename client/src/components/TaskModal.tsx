import React, { useState, useEffect } from 'react';
import type { Task, PriorityLevel } from '../types';
import { X, Loader2, Flag, Calendar, Tag } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    priority?: PriorityLevel;
    dueDate?: string | null;
    tag?: string;
  }) => Promise<void>;
  initialTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority || 'medium');
      setDueDate(
        initialTask.dueDate
          ? new Date(initialTask.dueDate).toISOString().split('T')[0]
          : ''
      );
      setTag(initialTask.tag || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setTag('');
    }
    setError(null);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Task title is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Convert dueDate date string to full ISO if set
      let isoDueDate: string | null = null;
      if (dueDate) {
        const d = new Date(dueDate);
        isoDueDate = d.toISOString();
      }

      await onSubmit({
        title: trimmedTitle,
        description: description.trim() || undefined,
        priority,
        dueDate: isoDueDate,
        tag: tag.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save task');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDueDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="task-title"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              required
              maxLength={200}
              placeholder="e.g., Review project documentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="task-description"
              rows={3}
              maxLength={2000}
              placeholder="Add extra context, requirements, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-y"
            />
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-slate-500" />
              <span>Priority</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { level: 'low', label: 'Low', color: 'border-slate-300 text-slate-700 bg-slate-50' },
                  { level: 'medium', label: 'Medium', color: 'border-blue-300 text-blue-700 bg-blue-50/50' },
                  { level: 'high', label: 'High', color: 'border-amber-300 text-amber-700 bg-amber-50/50' },
                  { level: 'urgent', label: 'Urgent', color: 'border-rose-300 text-rose-700 bg-rose-50/50' },
                ] as const
              ).map((p) => (
                <button
                  key={p.level}
                  type="button"
                  onClick={() => setPriority(p.level)}
                  className={`py-1.5 text-xs font-medium rounded-md border text-center active:scale-95 transition-all cursor-pointer ${
                    priority === p.level
                      ? `${p.color} font-bold shadow-2xs ring-1 ring-slate-900/20 border-slate-400`
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date & Tag in 2 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label
                htmlFor="task-due-date"
                className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Due Date</span>
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />
              <div className="flex items-center gap-1.5 mt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickDate(0)}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(1)}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all cursor-pointer"
                >
                  Tomorrow
                </button>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="px-2 py-0.5 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50 active:scale-95 transition-all ml-auto cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="task-tag"
                className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5"
              >
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>Label / Tag</span>
              </label>
              <input
                id="task-tag"
                type="text"
                maxLength={50}
                placeholder="e.g. work, personal"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-3 py-1.5 text-xs text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:scale-95 rounded-md border border-slate-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-md shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{initialTask ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
