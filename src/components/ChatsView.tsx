import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { DirectMessages } from '@/pages/DirectMessages';
import { SmarsGroup } from '@/components/SmarsGroup';

export function ChatsView() {
  const [tab, setTab] = useState<'direct' | 'smars'>('direct');

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="flex bg-white border-b border-gray-200 px-4 pt-3">
        <button
          onClick={() => setTab('direct')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            tab === 'direct'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Direct
        </button>
        <button
          onClick={() => setTab('smars')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            tab === 'smars'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Smars
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === 'direct' && <DirectMessages />}
        {tab === 'smars' && <SmarsGroup />}
      </div>
    </div>
  );
}
