import { useEffect, useState, useRef, useCallback } from 'react';
import { Send, Search, ArrowLeft, MessageCircle, Lock, Loader2, Circle, CheckCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/Avatar';
import { ChatBackground } from '@/components/ChatBackground';
import { EmojiInput } from '@/components/EmojiPicker';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import { formatLastSeen } from '@/lib/formatTime';
import { isStickerMessage } from '@/lib/stickers';
import type { Profile, DirectMessage } from '@/lib/types';

interface DecryptedMessage extends DirectMessage {
  decryptedContent: string;
  encrypted: boolean;
}

export function DirectMessages() {
  const { user, profile, privateKey, isOnline, getLastSeen } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mobileViewRef = useRef<'list' | 'chat'>('list');

  useEffect(() => {
    async function loadMembers() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user!.id)
        .eq('is_active', true)
        .order('display_name');
      setMembers((data as Profile[]) ?? []);
      setLoading(false);
    }
    loadMembers();
  }, [user]);

  const loadMessages = useCallback(
    async (otherUserId: string) => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user!.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user!.id})`
        )
        .order('created_at', { ascending: true });
      if (!data) return;

      const filtered = data as DirectMessage[];

      const otherUser = members.find((m) => m.id === otherUserId);
      const decrypted: DecryptedMessage[] = await Promise.all(
        filtered.map(async (msg): Promise<DecryptedMessage> => {
          if (msg.iv && privateKey && profile?.public_key && otherUser?.public_key) {
            try {
              const isOutgoing = msg.sender_id === user!.id;
              const senderPubKey = isOutgoing ? profile.public_key : otherUser.public_key;
              const content = await decryptMessage(msg.content, msg.iv, senderPubKey, privateKey);
              return { ...msg, decryptedContent: content, encrypted: true };
            } catch {
              return { ...msg, decryptedContent: '[Unable to decrypt]', encrypted: true };
            }
          }
          return { ...msg, decryptedContent: msg.content, encrypted: false };
        })
      );
      setMessages(decrypted);

      // Mark unread messages as read
      const unread = filtered.filter(
        (m) => m.recipient_id === user!.id && m.read_at === null
      );
      if (unread.length > 0) {
        await supabase
          .from('direct_messages')
          .update({ read_at: new Date().toISOString() })
          .in(
            'id',
            unread.map((m) => m.id)
          );
      }
    },
    [user, privateKey, profile, members]
  );

  useEffect(() => {
    if (!selectedMember || !user) return;
    loadMessages(selectedMember.id);

    const channel = supabase
      .channel(`dm-${user.id}-${selectedMember.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
        },
        async (payload) => {
          const msg = payload.new as DirectMessage;
          if (
            (msg.sender_id === user.id && msg.recipient_id === selectedMember.id) ||
            (msg.sender_id === selectedMember.id && msg.recipient_id === user.id)
          ) {
            // Try to decrypt the new message
            if (msg.iv && privateKey && profile?.public_key && selectedMember.public_key) {
              try {
                const isOutgoing = msg.sender_id === user.id;
                const senderPubKey = isOutgoing ? profile.public_key : selectedMember.public_key;
                const content = await decryptMessage(msg.content, msg.iv, senderPubKey, privateKey);
                setMessages((prev) => [...prev, { ...msg, decryptedContent: content, encrypted: true }]);
              } catch {
                setMessages((prev) => [...prev, { ...msg, decryptedContent: '[Unable to decrypt]', encrypted: true }]);
              }
            } else {
              setMessages((prev) => [...prev, { ...msg, decryptedContent: msg.content, encrypted: false }]);
            }
            if (msg.sender_id === selectedMember.id && msg.read_at === null) {
              supabase
                .from('direct_messages')
                .update({ read_at: new Date().toISOString() })
                .eq('id', msg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMember, user, loadMessages, privateKey, profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const doSend = useCallback(async () => {
    if (!newMessage.trim() || !selectedMember || !user) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const canEncrypt = privateKey && profile?.public_key && selectedMember.public_key;

    if (canEncrypt) {
      const { ciphertext, iv } = await encryptMessage(content, selectedMember.public_key!, privateKey!);
      const { data } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedMember.id,
          content: ciphertext,
          iv,
        })
        .select()
        .single();

      if (data) {
        setMessages((prev) => [...prev, { ...(data as DirectMessage), decryptedContent: content, encrypted: true }]);
      }
    } else {
      // Fallback to plaintext if encryption keys aren't available
      const { data } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedMember.id,
          content,
        })
        .select()
        .single();

      if (data) {
        setMessages((prev) => [...prev, { ...(data as DirectMessage), decryptedContent: content, encrypted: false }]);
      }
    }
    setSending(false);
  }, [newMessage, selectedMember, user, privateKey, profile]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    doSend();
  }

  const filteredMembers = members.filter(
    (m) =>
      m.display_name.toLowerCase().includes(search.toLowerCase()) ||
      m.full_name.toLowerCase().includes(search.toLowerCase())
  );

  function selectMember(m: Profile) {
    setSelectedMember(m);
    mobileViewRef.current = 'chat';
  }

  const canEncryptCurrent = !!(privateKey && profile?.public_key && selectedMember?.public_key);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Member list */}
      <div
        className={`w-80 xl:w-[400px] border-r border-[#313d45] flex flex-col bg-[#111b21] min-h-0 ${
          mobileViewRef.current === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="px-4 pt-4 pb-2 bg-[#111b21]">
          <h2 className="text-lg font-semibold text-[#e9edef] mb-3">Direct Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search classmates..."
              className="w-full pl-10 pr-4 py-2 bg-[#202c33] text-[#e9edef] placeholder:text-[#8696a0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00a884]/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="p-4 text-center text-sm text-[#8696a0]">Loading...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-4 text-center text-sm text-[#8696a0]">
              {search ? 'No members found' : 'No other members yet'}
            </div>
          ) : (
            filteredMembers.map((m) => {
              const online = isOnline(m.id);
              const seen = getLastSeen(m.id);
              const isStale = !online && !seen;
              return (
                <button
                  key={m.id}
                  onClick={() => selectMember(m)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[#202c33] transition-colors ${
                    selectedMember?.id === m.id ? 'bg-[#2a3942]' : ''
                  }`}
                >
                  <Avatar profile={m} size="md" showStatus isOnline={online} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[15px] text-[#e9edef] truncate">{m.display_name}</p>
                    <p className="text-xs truncate flex items-center gap-1">
                      {online ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-[#00a884] font-medium">
                            <Circle className="w-1.5 h-1.5 fill-[#00a884] text-[#00a884]" />
                            Active now
                          </span>
                          <span className="text-[#8696a0]">· {m.full_name}</span>
                        </>
                      ) : (
                        <span className={isStale ? 'text-[#667781] italic' : 'text-[#8696a0]'}>
                          {isStale ? 'Inactive' : formatLastSeen(seen)}
                        </span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div
        className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
          mobileViewRef.current === 'list' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedMember ? (
          <>
            <div className="px-4 py-2.5 bg-[#202c33] flex items-center gap-3">
              <button
                onClick={() => {
                  mobileViewRef.current = 'list';
                  setSelectedMember(null);
                }}
                className="md:hidden text-[#aebac1] hover:text-[#e9edef]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Avatar profile={selectedMember} size="md" showStatus isOnline={isOnline(selectedMember.id)} />
              <div className="flex-1">
                <p className="text-[15px] text-[#e9edef]">{selectedMember.display_name}</p>
                <p className={`text-xs flex items-center gap-1 ${isOnline(selectedMember.id) ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>
                  {isOnline(selectedMember.id) ? (
                    <><Circle className="w-1.5 h-1.5 fill-[#00a884] text-[#00a884]" />Active now</>
                  ) : (
                    formatLastSeen(getLastSeen(selectedMember.id))
                  )}
                </p>
              </div>
              {canEncryptCurrent ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#202c33] text-[#00a884] text-xs font-medium rounded-lg" title="Messages are end-to-end encrypted">
                  <Lock className="w-3 h-3" />
                  Encrypted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#202c33] text-[#8696a0] text-xs font-medium rounded-lg" title="Encryption not available — recipient hasn't set up keys yet">
                  <Lock className="w-3 h-3" />
                  Setup needed
                </span>
              )}
            </div>

            <ChatBackground themeId={profile?.chat_theme ?? 'mountain'}>
              <div className="flex-1 overflow-y-auto scrollbar-thin px-[6%] py-4 space-y-1.5">
                {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[#8696a0]">
                  <MessageCircle className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user!.id;
                  const isStickerOnly = isStickerMessage(msg.decryptedContent);
                  if (isStickerOnly) {
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className="flex flex-col gap-1 max-w-[70%]">
                          <div className="text-6xl leading-none p-1">{msg.decryptedContent.trim()}</div>
                          <p className={`text-[10px] flex items-center gap-1 ${isOwn ? 'text-[#8696a0] self-end' : 'text-[#8696a0] self-start'}`}>
                            {msg.encrypted && <Lock className="w-2.5 h-2.5" />}
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
                      <div
                        className={`max-w-[65%] px-2.5 pt-1.5 pb-1 rounded-lg text-sm shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${isOwn ? 'rounded-tr-none' : 'rounded-tl-none'} ${
                          isOwn
                            ? 'bg-[#005c4b] text-[#e9edef]'
                            : 'bg-[#202c33] text-[#e9edef]'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.decryptedContent}</p>
                        <p
                          className="text-[11px] mt-0.5 flex items-center justify-end gap-1 text-[#8696a0]"
                        >
                          {msg.encrypted && <Lock className="w-2.5 h-2.5" />}
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {isOwn && (
                            <CheckCheck className={`w-3.5 h-3.5 ${msg.read_at ? 'text-[#53bdeb]' : 'text-[#8696a0]'}`} />
                          )}
                        </p>
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
              className="px-3 py-2.5 bg-[#202c33] flex items-center gap-2"
            >
              <EmojiInput
                value={newMessage}
                onChange={setNewMessage}
                placeholder="Type a message..."
                onSticker={(s) => { setNewMessage(s); doSend(); }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-11 h-11 bg-[#00a884] hover:bg-[#029c7a] text-white rounded-full flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#8696a0]">
            <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-base font-medium text-[#e9edef]">Select a classmate to chat</p>
            <p className="text-sm mt-1">Choose someone from the list to start a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}
