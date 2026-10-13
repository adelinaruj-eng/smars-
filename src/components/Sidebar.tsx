import { GraduationCap, LogOut, MessageCircle, Users, User as UserIcon, Shield, Camera, Image as ImageIcon, Sparkles, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/Avatar';

export type View = 'chats' | 'status' | 'memories' | 'smars-ai' | 'profile' | 'admin';

interface SidebarProps {
  view: View;
  onViewChange: (view: View) => void;
}

export function Sidebar({ view, onViewChange }: SidebarProps) {
  const { profile, user, isOnline, signOut } = useAuth();

  const navItems: { id: View; label: string; icon: LucideIcon }[] = [
    { id: 'chats', label: 'Chats', icon: MessageCircle },
    { id: 'status', label: 'Status', icon: Camera },
    { id: 'memories', label: 'Memories', icon: ImageIcon },
    { id: 'smars-ai', label: 'Smars AI', icon: Sparkles },
    { id: 'profile', label: 'My Profile', icon: UserIcon },
    { id: 'admin', label: 'Admin Portal', icon: Shield },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-base font-bold text-gray-900 leading-tight">Rubya Seminary</h1>
            <p className="text-xs text-gray-400">Class of 2025</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar profile={profile} size="md" showStatus isOnline={!!user && isOnline(user.id)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.display_name || profile?.full_name}
            </p>
            {profile?.is_admin && (
              <span className="text-xs text-accent-600 font-medium">Administrator</span>
            )}
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all mt-1"
        >
          <LogOut className="w-4.5 h-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
