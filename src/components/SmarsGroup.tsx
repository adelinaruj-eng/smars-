import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, ArrowLeft, MessageSquare, Loader2, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/Avatar';
import { ChatBackground } from '@/components/ChatBackground';
import { EmojiInput } from '@/components/EmojiPicker';
import { formatLastSeen } from '@/lib/formatTime';
import type { Profile, GroupChat, GroupMessage } from '@/lib/types';

export function SmarsGroup() {
  const { user, profile, isOnline, getLastSeen } = useAuth();
  const [smarsGroup, setSmarsGroup] = useState<GroupChat | null>(null);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [allProfiles, setAllProfiles] = useState<Record<string, Profile>>({});
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mobileViewRef = useRef<'info' | 'chat'>('chat');

  useEffect(() => {
    async function loadSmars() {
      if (!user) return;
      const { data: groupData } = await supabase
        .from('group_chats')
        .select('*')
        .eq('name', 'Smars')
        .maybeSingle();

      if (!groupData) {
        setLoading(false);
        return;
      }

      setSmarsGroup(groupData as GroupChat);

      const { data: memberData } = await supabase
        .from('group_chat_members')
        .select('user_id')
        .eq('group_chat_id', (groupData as GroupChat).id);
      setMemberIds((memberData as { user_id: string }[] | null)?.map((m) => m.user_id) ?? []);

      const { data: profilesData } = await supabase.from('profiles').select('*');
      const profileMap: Record<string, Profile> = {};
      (profilesData as Profile[] | null)?.forEach((p) => {
        profileMap[p.id] = p;
      });
      setAllProfiles(profileMap);
      setLoading(false);
    }
    loadSmars();
  }, [user]);

  const loadMessages = useCallback(async (groupId: string) => {
    const { data } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_chat_id', groupId)
      .order('created_at', { ascending: true });
    setMessages((data as GroupMessage[]) ?? []);
  }, []);

  useEffect(() => {
    if (!smarsGroup) return;
    loadMessages(smarsGroup.id);

    const channel = supabase
      .channel(`group-${smarsGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_chat_id=eq.${smarsGroup.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as GroupMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [smarsGroup, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const doSend = useCallback(async () => {
    if (!newMessage.trim() || !smarsGroup || !user) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const { data } = await supabase
      .from('group_messages')
      .insert({
        group_chat_id: smarsGroup.id,
        sender_id: user.id,
        content,
      })
      .select()
      .single();

    if (data) {
      setMessages((prev) => [...prev, data as GroupMessage]);
    }
    setSending(false);
  }, [newMessage, smarsGroup, user]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    doSend();
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-300">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  if (!smarsGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
        <Users className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-base font-medium text-gray-500">Smars Group</p>
        <p className="text-sm mt-1">The community group is being set up. Please check back shortly.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Members sidebar — visible on desktop */}
      <div
        className={`w-72 border-r border-gray-200 flex-col bg-white min-h-0 ${
          mobileViewRef.current === 'info' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
          <button
            onClick={() => { mobileViewRef.current = 'chat'; }}
            className="md:hidden text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Smars</p>
            <p className="text-xs text-gray-400">{memberIds.length} members</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {memberIds.map((uid) => {
            const p = allProfiles[uid];
            return (
              <div key={uid} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors">
                <Avatar profile={p ?? null} size="sm" showStatus isOnline={isOnline(uid)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {p?.display_name ?? 'Unknown'}
                  </p>
                  <p className={`text-xs truncate ${isOnline(uid) ? 'text-green-500' : 'text-gray-400'}`}>
                    {isOnline(uid) ? 'Online' : formatLastSeen(getLastSeen(uid))}
                  </p>
                </div>
                {uid === user?.id && (
                  <span className="text-xs text-gray-400">You</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${mobileViewRef.current === 'info' ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Smars</p>
            <p className="text-xs text-gray-400">
              {memberIds.length} members
              {smarsGroup.description && ` · ${smarsGroup.description}`}
            </p>
          </div>
          <button
            onClick={() => { mobileViewRef.current = 'info'; }}
            className="md:hidden flex -space-x-2"
          >
            {memberIds.slice(0, 4).map((uid) => (
              <Avatar key={uid} profile={allProfiles[uid] ?? null} size="sm" />
            ))}
            {memberIds.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center ring-2 ring-white">
                +{memberIds.length - 4}
              </div>
            )}
          </button>
          <div className="hidden md:flex -space-x-2">
            {memberIds.slice(0, 5).map((uid) => (
              <Avatar key={uid} profile={allProfiles[uid] ?? null} size="sm" showStatus isOnline={isOnline(uid)} />
            ))}
            {memberIds.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 text-xs flex items-center justify-center ring-2 ring-white">
                +{memberIds.length - 5}
              </div>
            )}
          </div>
        </div>

        <ChatBackground themeId={profile?.chat_theme ?? 'mountain'}>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === user!.id;
                const sender = allProfiles[msg.sender_id];
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isOwn && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <Avatar profile={sender ?? null} size="sm" className="!w-6 !h-6 !text-[10px]" />
                          <span className="text-xs font-medium text-gray-600">
                            {sender?.display_name ?? 'Unknown'}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-100' : 'text-gray-400'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ChatBackground>

        <form
          onSubmit={sendMessage}
          className="px-4 py-3 bg-white border-t border-gray-200 flex items-center gap-2"
        >
          <EmojiInput
            value={newMessage}
            onChange={setNewMessage}
            placeholder="Type a message to the community..."
            onSend={doSend}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
