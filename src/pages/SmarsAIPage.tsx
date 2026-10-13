import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Sparkles, Loader2, Trash2, User as UserIcon, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smars-ai`;

const SUGGESTIONS = [
  { icon: 'books', text: 'Tell me the history of the Class of 2025' },
  { icon: 'lightbulb', text: 'Explain quantum physics in simple terms' },
  { icon: 'chat', text: 'What happened in 2023 for our class?' },
  { icon: 'spirit', text: 'Write a short poem about seminary life' },
];

function SuggestionIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    books: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
    lightbulb: 'M9 18h6M10 22h4M15.09 14c-.18-.79-.32-1.42-.32-2.5a5.5 5.5 0 1 0-5.54 0c0 1.08-.14 1.71-.32 2.5',
    chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    spirit: 'M12 2a3 3 0 0 0-3 3c0 1.31.83 2.42 2 2.83V10H8a1 1 0 0 0 0 2h3v8H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-8h3a1 1 0 0 0 0-2h-3V7.83c1.17-.41 2-1.52 2-2.83a3 3 0 0 0-3-3z',
  };
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[type] || icons.chat} />
    </svg>
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatContent(text: string): string {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:text-primary-700 underline">$1</a>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^\* (.*?)$/gm, '&bull; $1');
  html = html.replace(/^### (.*?)$/gm, '<strong>$1</strong>');
  html = html.replace(/^## (.*?)$/gm, '<strong>$1</strong>');
  html = html.replace(/^---$/gm, '<hr class="border-gray-200 my-3" />');
  html = html.replace(/\n/g, '<br />');
  return html;
}

export function SmarsAIPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    setMessages((data as ChatMessage[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user || sending) return;
    const userMessage = input.trim();
    setInput('');
    setSending(true);
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const userMsg = {
      id: tempId,
      role: 'user' as const,
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    await supabase.from('ai_conversations').insert({
      user_id: user.id,
      role: 'user',
      content: userMessage,
    });

    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.error('Smars AI response not ok:', response.status, errBody);
        throw new Error(`Request failed (${response.status})`);
      }

      const data = await response.json();
      if (data.debug_error) {
        console.error('Smars AI debug error from server:', data.debug_error);
      }
      const aiResponse = data.response ?? data.error ?? 'I could not process that request.';

      const { data: inserted } = await supabase.from('ai_conversations').insert({
        user_id: user.id,
        role: 'assistant',
        content: aiResponse,
      }).select().single();

      const aiMsg: ChatMessage = (inserted as ChatMessage) ?? {
        id: `ai-${Date.now()}`,
        role: 'assistant' as const,
        content: aiResponse,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        userMsg,
        aiMsg,
      ]);
    } catch (err) {
      const errorMsg = 'Sorry, I could not reach the AI service right now. Please try again in a moment.';
      console.error('Smars AI fetch error:', err);
      setError(errorMsg);
      await supabase.from('ai_conversations').insert({
        user_id: user.id,
        role: 'assistant',
        content: errorMsg,
      });
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        userMsg,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant' as const,
          content: errorMsg,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setSending(false);
    inputRef.current?.focus();
  }

  async function clearChat() {
    if (!user) return;
    await supabase.from('ai_conversations').delete().eq('user_id', user.id);
    setMessages([]);
    setError(null);
  }

  function handleSuggestion(text: string) {
    setInput(text);
    inputRef.current?.focus();
  }

  function handleRetry() {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-primary-600 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <Sparkles className="w-4.5 h-4.5 text-white" style={{ width: '1.125rem', height: '1.125rem' }} />
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-gray-900 leading-tight">Smars AI</h2>
            <p className="text-[11px] text-gray-400 leading-tight">Powered by Gemini</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-300">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-primary-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-serif text-3xl font-bold bg-gradient-to-r from-primary-600 via-blue-600 to-accent-600 bg-clip-text text-transparent mb-2">
                Hello there
              </h1>
              <p className="text-gray-400 text-base mb-10">
                I'm Smars AI — powered by Gemini. Ask me anything: general knowledge, science, math, writing, or the full history of the Rubya Seminary Class of 2025.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => handleSuggestion(s.text)}
                    className="flex items-center gap-3 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl text-sm text-gray-600 hover:text-gray-900 hover:border-gray-200 transition-all text-left group"
                  >
                    <span className="text-gray-400 group-hover:text-primary-500 transition-colors flex-shrink-0">
                      <SuggestionIcon type={s.icon} />
                    </span>
                    <span className="flex-1">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => (
                <div key={msg.id} className={`flex gap-3 sm:gap-4 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'user' ? (
                    <div className="w-8 h-8 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-primary-600 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                    <div
                      className={`inline-block max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white rounded-tr-sm'
                          : 'text-gray-800 rounded-tl-sm'
                      }`}
                      dangerouslySetInnerHTML={msg.role === 'assistant' ? { __html: formatContent(msg.content) } : undefined}
                    >
                      {msg.role === 'user' ? msg.content : null}
                    </div>
                    <div className={`flex items-center gap-3 mt-1.5 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      <span className="text-[10px] text-gray-300">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.role === 'assistant' && idx === messages.length - 1 && error && (
                        <button
                          onClick={handleRetry}
                          className="text-[11px] text-gray-400 hover:text-primary-600 flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex gap-3 sm:gap-4 animate-fade-in">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-primary-600 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 py-3">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full pl-5 pr-1.5 py-1.5 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Smars AI anything..."
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-9 h-9 bg-gradient-to-br from-primary-600 to-accent-600 hover:opacity-90 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          <p className="text-center text-[10px] text-gray-300 mt-2">
            Smars AI may produce inaccurate info about people or facts
          </p>
        </div>
      </div>
    </div>
  );
}
