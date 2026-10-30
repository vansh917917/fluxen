import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Database, LayoutList } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: 'login' | 'register' | 'dashboard') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="py-12 sm:py-20">
      {/* Hero section */}
      <div className="max-w-3xl mx-auto text-center px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Full-Stack Task Management</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
          Keep your daily tasks clear, organized, and under control.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
          Fluxen provides personal task tracking with instant updates, user authentication, and persistent PostgreSQL storage.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('register')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition-colors"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Feature Pillars */}
      <div className="max-w-4xl mx-auto mt-20 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg border border-slate-200">
            <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-800 mb-4">
              <LayoutList className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Personal Dashboard
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Create, filter, edit, and mark tasks complete with immediate feedback on desktop and mobile.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border border-slate-200">
            <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-800 mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              Secure Authentication
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Password hashing with bcrypt, verified session management, and server-side ownership enforcement.
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg border border-slate-200">
            <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-800 mb-4">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">
              PostgreSQL Persistence
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Data durability via Prisma ORM. Refresh the page or log in from any device to see your tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Checklist banner */}
      <div className="max-w-2xl mx-auto mt-16 px-4">
        <div className="p-6 bg-slate-100/80 rounded-lg border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
            Core Principles
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Independent task ownership strictly verified on the server</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Minimalist, fast interface without clutter or bloated libraries</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Standard REST API with clean HTTP status codes and error messages</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
