import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { DirectMessages } from '@/pages/DirectMessages';
import { SmarsGroup } from '@/components/SmarsGroup';
import { useAuth } from '@/lib/auth-context';

const TABS = [
  { id: 'direct', label: 'Direct', icon: MessageCircle },
  { id: 'smars', label: 'Smars', icon: Users },
] as const;

export function ChatsView() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'direct' | 'smars'>('direct');
  const mode = profile?.chat_mode ?? 'light';

  return (
    <div className={`chat-${mode} flex flex-col h-full min-h-0 overflow-hidden bg-[var(--chat-panel)]`}>
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--chat-panel)] border-b border-[var(--chat-border)]">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'bg-[var(--chat-active)] border-[var(--chat-accent)] text-[var(--chat-accent)]'
                  : 'border-[var(--chat-chip-border)] text-[var(--chat-text)] hover:bg-[var(--chat-hover)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === 'direct' && <DirectMessages />}
        {tab === 'smars' && <SmarsGroup />}
      </div>
    </div>
  );
}
