import { useEffect, useState, useRef } from 'react';
import { Plus, X, Camera, CircleDashed, Trash2, Eye, ChevronLeft, ChevronRight, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/Avatar';
import { EmojiInput } from '@/components/EmojiPicker';
import type { Profile, Status, StatusView } from '@/lib/types';

const STATUS_COLORS = [
  'bg-primary-600', 'bg-accent-600', 'bg-blue-600', 'bg-purple-600',
  'bg-pink-600', 'bg-red-600', 'bg-indigo-600', 'bg-teal-600',
];

const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;

interface StatusGroup {
  user: Profile;
  statuses: Status[];
  viewed: boolean;
}

export function StatusPage() {
  const { user, profile } = useAuth();
  const [statusGroups, setStatusGroups] = useState<StatusGroup[]>([]);
  const [allProfiles, setAllProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [bgColor, setBgColor] = useState(0);
  const [posting, setPosting] = useState(false);
  const [postingType, setPostingType] = useState<'photo' | 'video'>('photo');
  const [viewingUser, setViewingUser] = useState<StatusGroup | null>(null);
  const [viewingIndex, setViewingIndex] = useState(0);
  const [viewCount, setViewCount] = useState<StatusView[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  async function loadStatuses() {
    const cutoff = new Date(Date.now() - FIFTEEN_DAYS).toISOString();
    const { data: statusData } = await supabase
      .from('statuses')
      .select('*')
      .gt('created_at', cutoff)
      .order('created_at', { ascending: true });
    if (!statusData) return;

    const { data: profileData } = await supabase.from('profiles').select('*');
    const profileMap: Record<string, Profile> = {};
    (profileData as Profile[] | null)?.forEach((p) => { profileMap[p.id] = p; });
    setAllProfiles(profileMap);

    const { data: viewData } = await supabase.from('status_views').select('*');
    const viewedStatusIds = new Set((viewData as StatusView[] | null)?.map((v) => v.status_id) ?? []);

    // Group by user
    const grouped: Record<string, Status[]> = {};
    (statusData as Status[] | null)?.forEach((s) => {
      if (!grouped[s.user_id]) grouped[s.user_id] = [];
      grouped[s.user_id].push(s);
    });

    const groups: StatusGroup[] = Object.entries(grouped).map(([uid, statuses]) => ({
      user: profileMap[uid] ?? { id: uid, display_name: 'Unknown', full_name: '', avatar_url: null, bio: '', is_admin: false, is_active: true, chat_theme: 'mountain', created_at: '', updated_at: '' },
      statuses,
      viewed: statuses.every((s) => viewedStatusIds.has(s.id)),
    }));

    // Sort: own first, then unviewed, then viewed
    groups.sort((a, b) => {
      if (a.user.id === user?.id) return -1;
      if (b.user.id === user?.id) return 1;
      if (a.viewed !== b.viewed) return a.viewed ? 1 : -1;
      return 0;
    });

    setStatusGroups(groups);
    setLoading(false);
  }

  useEffect(() => {
    loadStatuses();
  }, [user]);

  async function postTextStatus() {
    if (!textContent.trim() || !user) return;
    setPosting(true);
    await supabase.from('statuses').insert({
      user_id: user.id,
      content: textContent.trim(),
      type: 'text',
      background_color: STATUS_COLORS[bgColor],
    });
    setTextContent('');
    setShowComposer(false);
    setPosting(false);
    await loadStatuses();
  }

  async function postPhotoStatus(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPosting(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('class-photos')
      .upload(fileName, file);

    if (uploadError) {
      alert(uploadError.message);
      setPosting(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('class-photos').getPublicUrl(fileName);
    await supabase.from('statuses').insert({
      user_id: user.id,
      content: urlData.publicUrl,
      type: 'photo',
    });
    setPosting(false);
    await loadStatuses();
  }

  async function postVideoStatus(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPosting(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('class-photos')
      .upload(fileName, file);

    if (uploadError) {
      alert(uploadError.message);
      setPosting(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('class-photos').getPublicUrl(fileName);
    await supabase.from('statuses').insert({
      user_id: user.id,
      content: urlData.publicUrl,
      type: 'video',
    });
    setPosting(false);
    await loadStatuses();
  }

  async function viewStatus(group: StatusGroup) {
    if (group.user.id === user?.id) {
      // Viewing own status — just show it, no view tracking
      setViewingUser(group);
      setViewingIndex(0);
      loadViews(group.statuses[0].id);
      return;
    }
    setViewingUser(group);
    setViewingIndex(0);

    // Mark all statuses as viewed
    for (const s of group.statuses) {
      await supabase.from('status_views').upsert({
        status_id: s.id,
        viewer_id: user!.id,
      });
    }
    loadViews(group.statuses[0].id);
    await loadStatuses();
  }

  async function loadViews(statusId: string) {
    const { data } = await supabase.from('status_views').select('*').eq('status_id', statusId);
    setViewCount((data as StatusView[]) ?? []);
  }

  function nextStatus() {
    if (!viewingUser) return;
    const next = viewingIndex + 1;
    if (next >= viewingUser.statuses.length) {
      setViewingUser(null);
    } else {
      setViewingIndex(next);
      loadViews(viewingUser.statuses[next].id);
    }
  }

  function prevStatus() {
    if (viewingUser && viewingIndex > 0) {
      setViewingIndex(viewingIndex - 1);
      loadViews(viewingUser.statuses[viewingIndex - 1].id);
    }
  }

  async function deleteStatus(statusId: string) {
    await supabase.from('statuses').delete().eq('id', statusId);
    await loadStatuses();
    setViewingUser(null);
  }

  const myStatus = statusGroups.find((g) => g.user.id === user?.id);
  const otherStatuses = statusGroups.filter((g) => g.user.id !== user?.id);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-1">Status</h2>
        <p className="text-sm text-gray-400 mb-6">Share updates that last for 15 days</p>

        {/* My status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (myStatus ? viewStatus(myStatus) : setShowComposer(true))}
              className="relative"
            >
              <Avatar profile={profile} size="lg" />
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-white">
                <Plus className="w-3.5 h-3.5 text-white" />
              </span>
            </button>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">My Status</p>
              <p className="text-xs text-gray-400">
                {myStatus
                  ? `${myStatus.statuses.length} update${myStatus.statuses.length !== 1 ? 's' : ''}`
                  : 'Tap to add status update'}
              </p>
            </div>
            {myStatus && (
              <button
                onClick={() => setShowComposer(true)}
                className="w-9 h-9 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center hover:bg-primary-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Recent updates */}
        {otherStatuses.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 px-1">Recent Updates</p>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {otherStatuses.map((group) => (
                <button
                  key={group.user.id}
                  onClick={() => viewStatus(group)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                >
                  <div className={`relative ${!group.viewed ? 'ring-2 ring-primary-500 rounded-full' : 'ring-2 ring-gray-300 rounded-full'}`}>
                    <Avatar profile={group.user} size="md" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{group.user.display_name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(group.statuses[group.statuses.length - 1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!group.viewed && <CircleDashed className="w-4 h-4 text-primary-500" />}
                </button>
              ))}
            </div>
          </>
        )}

        {!loading && otherStatuses.length === 0 && !myStatus && (
          <div className="text-center py-12 text-gray-400">
            <CircleDashed className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No status updates yet. Be the first to share!</p>
          </div>
        )}

        {posting && (
          <div className="fixed bottom-6 right-6 bg-primary-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-fade-in">
            <Camera className="w-4 h-4 animate-spin" />
            Posting...
          </div>
        )}
      </div>

      {/* Composer modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-serif text-lg font-bold text-gray-900">New Status</h3>
              <button onClick={() => setShowComposer(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Photo upload */}
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Photo
                </button>
                <button
                  onClick={() => videoInputRef.current?.click()}
                  className="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  Video
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={postPhotoStatus}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={postVideoStatus}
                className="hidden"
              />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or text status</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Text status */}
              <div className={`rounded-xl ${STATUS_COLORS[bgColor]} p-6 min-h-[120px] flex items-center justify-center`}>
                <input
                  type="text"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full bg-transparent text-center text-white text-lg font-medium placeholder-white/60 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-center">
                {STATUS_COLORS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setBgColor(i)}
                    className={`w-7 h-7 rounded-full ${c} ${bgColor === i ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  />
                ))}
              </div>

              <button
                onClick={postTextStatus}
                disabled={!textContent.trim()}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              >
                Post Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status viewer */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fade-in">
          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
            {viewingUser.statuses.map((_, i) => (
              <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white transition-all duration-500 ${i < viewingIndex ? 'w-full' : i === viewingIndex ? 'w-full' : 'w-0'}`}
                />
              </div>
            ))}
          </div>

          {/* Close */}
          <button
            onClick={() => setViewingUser(null)}
            className="absolute top-8 left-4 text-white/80 hover:text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Nav buttons */}
          {viewingIndex > 0 && (
            <button
              onClick={prevStatus}
              className="absolute left-2 text-white/80 hover:text-white z-10 p-2"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {viewingIndex < viewingUser.statuses.length - 1 && (
            <button
              onClick={nextStatus}
              className="absolute right-2 text-white/80 hover:text-white z-10 p-2"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Status content */}
          <div className="relative max-w-lg w-full mx-4" onClick={nextStatus}>
            {/* User info */}
            <div className="flex items-center gap-2 mb-4 px-4">
              <Avatar profile={viewingUser.user} size="md" />
              <div>
                <p className="text-white text-sm font-medium">{viewingUser.user.display_name}</p>
                <p className="text-white/60 text-xs">
                  {new Date(viewingUser.statuses[viewingIndex].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {viewingUser.statuses[viewingIndex].type === 'video' ? (
              <video
                src={viewingUser.statuses[viewingIndex].content}
                controls
                autoPlay
                className="w-full max-h-[70vh] object-contain rounded-xl"
              />
            ) : viewingUser.statuses[viewingIndex].type === 'photo' ? (
              <img
                src={viewingUser.statuses[viewingIndex].content}
                alt="Status"
                className="w-full max-h-[70vh] object-contain rounded-xl"
              />
            ) : (
              <div className={`${viewingUser.statuses[viewingIndex].background_color || 'bg-primary-600'} rounded-xl p-12 min-h-[300px] flex items-center justify-center`}>
                <p className="text-white text-2xl font-medium text-center leading-relaxed">
                  {viewingUser.statuses[viewingIndex].content}
                </p>
              </div>
            )}

            {/* Footer: view count + delete (own status) */}
            <div className="flex items-center justify-between mt-4 px-4">
              {viewingUser.user.id === user?.id ? (
                <div className="flex items-center gap-4">
                  <span className="text-white/60 text-xs flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {viewCount.length} view{viewCount.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteStatus(viewingUser.statuses[viewingIndex].id); }}
                    className="text-white/60 hover:text-red-400 text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              ) : (
                <span className="text-white/40 text-xs">Tap to advance</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
