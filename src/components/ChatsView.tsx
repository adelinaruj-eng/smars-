import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { DirectMessages } from '@/pages/DirectMessages';
import { SmarsGroup } from '@/components/SmarsGroup';

const TABS = [
  { id: 'direct', label: 'Direct', icon: MessageCircle },
  { id: 'smars', label: 'Smars', icon: Users },
] as const;

export function ChatsView() {
  const [tab, setTab] = useState<'direct' | 'smars'>('direct');

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#111b21] border-b border-[#313d45]">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'bg-[#00a884]/15 border-[#00a884]/50 text-[#00a884]'
                  : 'border-[#3b4a54] text-[#e9edef] hover:bg-[#202c33]'
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
