import { useState } from 'react';
import { MessageCircle, Users, Bot } from 'lucide-react';
import { DirectMessages } from '@/pages/DirectMessages';
import { SmarsGroup } from '@/components/SmarsGroup';
import { AIAssistant } from '@/components/AIAssistant';

export function ChatsView() {
  const [tab, setTab] = useState<'direct' | 'smars' | 'ai'>('direct');

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Navigation Tabs */}
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
        <button
          onClick={() => setTab('ai')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            tab === 'ai'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Bot className="w-4 h-4" />
          AI Assistant
        </button>
      </div>

      {/* Active Tab View Content */}
      <div className="flex-1 overflow-hidden p-4">
        {tab === 'direct' && <DirectMessages />}
        {tab === 'smars' && <SmarsGroup />}
        {tab === 'ai' && <AIAssistant />}
      </div>
    </div>
  );
}