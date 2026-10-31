import React, { useState } from 'react';
import type { Task } from '../types';
import { Check, Edit2, Trash2, Calendar, AlertTriangle, Flag, Tag as TagIcon } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
  onTagClick?: (tag: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onTagClick,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling) return;
    try {
      setIsToggling(true);
      await onToggleComplete(task.id, !task.completed);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(task.id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  // Due date calculations
  const dueDateInfo = (() => {
    if (!task.dueDate) return null;
    const due = new Date(task.dueDate);
    const now = new Date();
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 && !task.completed) {
      return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'Due Today', isToday: true };
    }
    if (diffDays === 1) {
      return { text: 'Due Tomorrow', isTomorrow: true };
    }
    return {
      text: due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      isRegular: true,
    };
  })();

  const priorityBadge = (() => {
    switch (task.priority) {
      case 'urgent':
        return { label: 'Urgent', style: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' };
      case 'high':
        return { label: 'High', style: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' };
      case 'medium':
        return { label: 'Medium', style: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' };
      case 'low':
      default:
        return { label: 'Low', style: 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80' };
    }
  })();

  return (
    <div
      className={`group relative p-4 rounded-lg border transition-all duration-150 ease-out ${
        task.completed
          ? 'bg-slate-50/60 border-slate-200/90 hover:border-slate-300 opacity-75'
          : 'bg-white border-slate-200 hover:border-slate-300/90 hover:shadow-xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Toggle + Content */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            aria-label={
              task.completed ? 'Mark task as pending' : 'Mark task as completed'
            }
            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all duration-150 active:scale-90 ${
              task.completed
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                : 'border-slate-300 hover:border-slate-500 bg-white hover:bg-slate-50'
            }`}
          >
            {task.completed ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : (
              <Check className="w-3 h-3 stroke-[2.5] text-slate-300 opacity-0 group-hover:opacity-40 transition-opacity" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3
                className={`text-sm break-words transition-colors duration-150 ${
                  task.completed
                    ? 'line-through text-slate-400 font-medium'
                    : 'text-slate-900 font-semibold'
                }`}
              >
                {task.title}
              </h3>

              {/* Priority badge */}
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors ${priorityBadge.style}`}
              >
                <Flag className="w-2.5 h-2.5" />
                {priorityBadge.label}
              </span>

              {/* Tag chip */}
              {task.tag && (
                <button
                  type="button"
                  onClick={() => onTagClick?.(task.tag!)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200/90 text-slate-700 border border-slate-200 active:scale-95 transition-all"
                  title={`Filter by #${task.tag}`}
                >
                  <TagIcon className="w-2.5 h-2.5 text-slate-500" />
                  #{task.tag}
                </button>
              )}
            </div>

            {task.description && (
              <p
                className={`text-xs break-words whitespace-pre-line leading-relaxed ${
                  task.completed ? 'text-slate-400 line-through' : 'text-slate-600'
                }`}
              >
                {task.description}
              </p>
            )}

            {/* Meta row: Due date & status */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
              {dueDateInfo && (
                <span
                  className={`inline-flex items-center gap-1 font-medium transition-colors ${
                    dueDateInfo.isOverdue
                      ? 'text-rose-600 font-bold'
                      : dueDateInfo.isToday
                      ? 'text-amber-700 font-semibold'
                      : 'text-slate-500'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {dueDateInfo.text}
                </span>
              )}

              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                  task.completed
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {task.completed ? 'Completed' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons with subtle desktop hover visibility */}
        <div className="flex items-center gap-1 shrink-0">
          {!confirmDelete ? (
            <div className="flex items-center gap-1 sm:opacity-50 sm:group-hover:opacity-100 transition-opacity duration-150">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 active:scale-90 rounded-md transition-all"
                title="Edit task"
                aria-label="Edit task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 rounded-md transition-all"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-200 rounded-md text-xs animate-in fade-in duration-150">
              <span className="flex items-center gap-1 text-[11px] text-rose-700 font-medium pl-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Delete?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {isDeleting ? '...' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-0.5 text-slate-600 hover:text-slate-900 active:scale-95 rounded text-[11px] font-medium transition-all"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
