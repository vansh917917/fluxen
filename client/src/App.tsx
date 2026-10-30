import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { Loader2 } from 'lucide-react';

type ViewMode = 'landing' | 'login' | 'register' | 'dashboard';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>('landing');

  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentView('dashboard');
      } else if (currentView === 'dashboard') {
        setCurrentView('login');
      }
    }
  }, [user, loading, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800 mb-2" />
        <p className="text-xs font-medium">Connecting to Fluxen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage onNavigate={setCurrentView} />
        )}
        {currentView === 'login' && (
          <LoginPage onNavigate={setCurrentView} />
        )}
        {currentView === 'register' && (
          <RegisterPage onNavigate={setCurrentView} />
        )}
        {currentView === 'dashboard' && (
          user ? <DashboardPage /> : <LoginPage onNavigate={setCurrentView} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Fluxen Task Management Application</span>
          <span>Simple, secure, and persistent full-stack task management</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

export default App;
