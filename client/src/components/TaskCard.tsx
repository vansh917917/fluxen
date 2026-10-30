import React, { useState } from 'react';
import type { Task } from '../types';
import { Check, Edit2, Trash2, Calendar, AlertTriangle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
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

  const formattedDate = new Date(task.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        task.completed
          ? 'bg-slate-50/70 border-slate-200'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
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
            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
              task.completed
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 hover:border-slate-500 bg-white'
            }`}
          >
            {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-medium break-words ${
                task.completed
                  ? 'line-through text-slate-400'
                  : 'text-slate-900 font-semibold'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p
                className={`mt-1 text-xs break-words whitespace-pre-line leading-relaxed ${
                  task.completed ? 'text-slate-400 line-through' : 'text-slate-600'
                }`}
              >
                {task.description}
              </p>
            )}

            <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </span>
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

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {!confirmDelete ? (
            <>
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="Edit task"
                aria-label="Edit task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1.5 p-1 bg-rose-50 border border-rose-200 rounded-md text-xs">
              <span className="flex items-center gap-1 text-[11px] text-rose-700 font-medium pl-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Delete?
              </span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '...' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-0.5 text-slate-600 hover:text-slate-900 rounded text-[11px] font-medium"
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
