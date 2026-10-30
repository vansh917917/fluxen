import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, LogOut, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: 'landing' | 'login' | 'register' | 'dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('login');
  };

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-sm"
        >
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-base font-semibold text-slate-900 tracking-tight block">
              Fluxen
            </span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
              Task Management
            </span>
          </div>
        </button>

        {/* Actions */}
        <nav className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="max-w-[180px] truncate">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                title="Log out of your account"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {currentView !== 'login' && (
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Log in
                </button>
              )}
              {currentView !== 'register' && (
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors"
                >
                  Register
                </button>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
