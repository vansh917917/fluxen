import React, { useState } from 'react';
import type { PriorityLevel } from '../types';
import { Plus, Flag, Loader2 } from 'lucide-react';

interface QuickAddBarProps {
  onAdd: (data: {
    title: string;
    priority: PriorityLevel;
    tag?: string;
  }) => Promise<void>;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({ onAdd, inputRef }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [tag, setTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    try {
      setLoading(true);
      await onAdd({
        title: cleanTitle,
        priority,
        tag: tag.trim() || undefined,
      });
      setTitle('');
      setTag('');
      setPriority('medium');
      setExpanded(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-lg border transition-all ${
        expanded
          ? 'border-slate-400 shadow-sm ring-1 ring-slate-900/5'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-center px-3.5 py-2.5 gap-2.5">
        <Plus className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Quick add a task... (Press 'N' or Enter)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          className="flex-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
        />

        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-500 shrink-0" />
        ) : (
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 rounded transition-colors"
          >
            Add
          </button>
        )}
      </div>

      {expanded && (
        <div className="px-3.5 pb-2.5 pt-1 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Priority selector */}
          <div className="flex items-center gap-1.5">
            <Flag className="w-3 h-3 text-slate-400" />
            {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize border transition-colors ${
                  priority === p
                    ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Quick Tag input */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Tag:</span>
            <input
              type="text"
              placeholder="#work"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-24 px-2 py-0.5 text-[11px] border border-slate-200 rounded focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>
      )}
    </form>
  );
};
