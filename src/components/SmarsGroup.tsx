import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, ArrowLeft, MessageSquare, Loader2, Users, Circle, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/Avatar';
import { ChatBackground } from '@/components/ChatBackground';
import { EmojiInput } from '@/components/EmojiPicker';
import { formatLastSeen } from '@/lib/formatTime';
import { isStickerMessage } from '@/lib/stickers';
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

      const [{ data: memberData }, { data: profilesData }] = await Promise.all([
        supabase.from('group_chat_members').select('user_id').eq('group_chat_id', (groupData as GroupChat).id),
        supabase.from('profiles').select('*'),
      ]);
      setMemberIds((memberData as { user_id: string }[] | null)?.map((m) => m.user_id) ?? []);

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
      <div className="flex-1 flex items-center justify-center text-[var(--chat-muted)]">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  if (!smarsGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[var(--chat-muted)]">
        <Users className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-base font-medium text-[var(--chat-text)]">Smars Group</p>
        <p className="text-sm mt-1">The community group is being set up. Please check back shortly.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Members sidebar — visible on desktop */}
      <div
        className={`w-64 border-r border-[var(--chat-border)] flex-col bg-[var(--chat-panel)] min-h-0 ${
          mobileViewRef.current === 'info' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="px-4 py-4 border-b border-[var(--chat-border)] flex items-center gap-3">
          <button
            onClick={() => { mobileViewRef.current = 'chat'; }}
            className="md:hidden text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-[var(--chat-text)]">Smars</p>
            <p className="text-xs text-[var(--chat-muted)]">{memberIds.length} members</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {memberIds.map((uid) => {
            const p = allProfiles[uid];
            const online = isOnline(uid);
            const seen = getLastSeen(uid);
            const isStale = !online && !seen;
            return (
              <div key={uid} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--chat-hover)] transition-colors">
                <Avatar profile={p ?? null} size="sm" showStatus isOnline={online} />
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] text-[var(--chat-text)] truncate">
                    {p?.display_name ?? 'Unknown'}
                  </p>
                  <p className={`text-xs truncate flex items-center gap-1 ${online ? 'text-[var(--chat-accent)] font-medium' : isStale ? 'text-[var(--chat-muted)] italic' : 'text-[var(--chat-muted)]'}`}>
                    {online ? (
                      <><Circle className="w-1.5 h-1.5 fill-[var(--chat-accent)] text-[var(--chat-accent)]" />Active now</>
                    ) : (
                      isStale ? 'Inactive' : formatLastSeen(seen)
                    )}
                  </p>
                </div>
                {uid === user?.id && (
                  <span className="text-xs text-[var(--chat-muted)]">You</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${mobileViewRef.current === 'info' ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-2.5 bg-[var(--chat-header)] flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] text-[var(--chat-text)]">Smars</p>
            <p className="text-xs text-[var(--chat-muted)]">
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
              <div className="w-8 h-8 rounded-full bg-[var(--chat-active)] text-[var(--chat-muted)] text-xs flex items-center justify-center ring-2 ring-[var(--chat-header)]">
                +{memberIds.length - 4}
              </div>
            )}
          </button>
          <div className="hidden md:flex -space-x-2">
            {memberIds.slice(0, 5).map((uid) => (
              <Avatar key={uid} profile={allProfiles[uid] ?? null} size="sm" showStatus isOnline={isOnline(uid)} />
            ))}
            {memberIds.length > 5 && (
              <div className="w-8 h-8 rounded-full bg-[var(--chat-active)] text-[var(--chat-muted)] text-xs flex items-center justify-center ring-2 ring-[var(--chat-header)]">
                +{memberIds.length - 5}
              </div>
            )}
          </div>
        </div>

        <ChatBackground themeId={profile?.chat_theme ?? 'mountain'}>
          <div className="flex-1 overflow-y-auto scrollbar-thin px-[6%] py-4 space-y-1.5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--chat-muted)]">
                <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
                <p className="text-sm">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender_id === user!.id;
                const sender = allProfiles[msg.sender_id];
                const isStickerOnly = isStickerMessage(msg.content);
                if (isStickerOnly) {
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                      <div className="flex flex-col gap-1 max-w-[75%]">
                        {!isOwn && (
                          <div className="flex items-center gap-1.5 ml-1">
                            <span className="text-xs font-medium text-[var(--chat-muted)]">
                              {sender?.display_name ?? 'Unknown'}
                            </span>
                          </div>
                        )}
                        <div className="text-6xl leading-none p-1">{msg.content.trim()}</div>
                        <p className={`text-[10px] ${isOwn ? 'text-[var(--chat-muted)] self-end' : 'text-[var(--chat-muted)] self-start'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isOwn && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <Avatar profile={sender ?? null} size="sm" className="!w-6 !h-6 !text-[10px]" />
                          <span className="text-xs font-medium text-[var(--chat-muted)]">
                            {sender?.display_name ?? 'Unknown'}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-2.5 pt-1.5 pb-1 rounded-lg text-sm shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${isOwn ? 'rounded-tr-none' : 'rounded-tl-none'} ${
                          isOwn
                            ? 'bg-[var(--chat-outgoing)] text-[var(--chat-text)]'
                            : 'bg-[var(--chat-incoming)] text-[var(--chat-text)]'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        <p
                          className="text-[11px] mt-0.5 flex items-center justify-end gap-1 text-[var(--chat-muted)]"
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {isOwn && <CheckCheck className="w-3.5 h-3.5 text-[var(--chat-muted)]" />}
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
          className="px-3 py-2.5 bg-[var(--chat-header)] flex items-center gap-2"
        >
          <EmojiInput
            value={newMessage}
            onChange={setNewMessage}
            placeholder="Type a message to the community..."
            onSticker={(s) => { setNewMessage(s); doSend(); }}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 bg-[var(--chat-accent)] hover:bg-[var(--chat-accent-hover)] text-white rounded-full flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
