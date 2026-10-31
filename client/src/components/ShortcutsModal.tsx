import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'N', desc: 'Focus Quick-Add bar or create new task' },
    { key: '/', desc: 'Quickly focus search input' },
    { key: 'Esc', desc: 'Close dialogs or clear active search' },
    { key: '?', desc: 'Open this keyboard shortcuts guide' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-semibold text-slate-900">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between text-xs text-slate-700"
            >
              <span>{s.desc}</span>
              <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded font-mono text-[11px] font-semibold text-slate-800 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
