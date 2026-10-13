import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AuthPage } from '@/pages/AuthPage';
import { Sidebar, type View } from '@/components/Sidebar';
import { ChatsView } from '@/components/ChatsView';
import { StatusPage } from '@/pages/StatusPage';
import { MemoriesPage } from '@/pages/MemoriesPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { AdminPortal } from '@/pages/AdminPortal';
import { SmarsAIPage } from '@/pages/SmarsAIPage';
import { GraduationCap, MessageCircle, Camera, Image as ImageIcon, User as UserIcon, Shield, Sparkles } from 'lucide-react';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [view, setView] = useState<View>('chats');

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 ring-1 ring-white/20">
            <GraduationCap className="w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="text-primary-200 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthPage />;
  }

  const mobileNavItems: { id: View; label: string; icon: typeof MessageCircle }[] = [
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'status', label: 'Status', icon: Camera },
    { id: 'memories', label: 'Memories', icon: ImageIcon },
    { id: 'smars-ai', label: 'Smars AI', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'admin', label: 'Admin', icon: Shield },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar view={view} onViewChange={setView} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-sm font-bold text-gray-900">Rubya 2025</span>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden flex bg-white border-t border-gray-200 order-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-xs font-medium transition-all ${
                  active ? 'text-primary-600' : 'text-gray-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-hidden min-h-0">
          {view === 'chats' && <ChatsView />}
          {view === 'status' && <StatusPage />}
          {view === 'memories' && <MemoriesPage />}
          {view === 'smars-ai' && <SmarsAIPage />}
          {view === 'profile' && <ProfilePage />}
          {view === 'admin' && <AdminPortal />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
