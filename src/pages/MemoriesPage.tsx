import { useEffect, useState, useRef } from 'react';
import {
  Upload, X, Check, Trash2, Heart, Clock, Image as ImageIcon,
  Loader2, Video,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/Avatar';
import type { Profile, ClassPhoto } from '@/lib/types';

export function MemoriesPage() {
  const { user, profile } = useAuth();
  const [photos, setPhotos] = useState<ClassPhoto[]>([]);
  const [allProfiles, setAllProfiles] = useState<Record<string, Profile>>({});
  const [likesByPhoto, setLikesByPhoto] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadMediaType, setUploadMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('approved');
  const [lightboxPhoto, setLightboxPhoto] = useState<ClassPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadPhotos() {
    const { data } = await supabase
      .from('class_photos')
      .select('*')
      .order('created_at', { ascending: false });
    const photoList = (data as ClassPhoto[]) ?? [];
    setPhotos(photoList);

    const { data: profileData } = await supabase.from('profiles').select('*');
    const profileMap: Record<string, Profile> = {};
    (profileData as Profile[] | null)?.forEach((p) => { profileMap[p.id] = p; });
    setAllProfiles(profileMap);

    const { data: likeData } = await supabase.from('class_photo_likes').select('*');
    const likeMap: Record<string, { count: number; liked: boolean }> = {};
    (likeData as { photo_id: string; user_id: string }[] | null)?.forEach((l) => {
      if (!likeMap[l.photo_id]) likeMap[l.photo_id] = { count: 0, liked: false };
      likeMap[l.photo_id].count++;
      if (l.user_id === user?.id) likeMap[l.photo_id].liked = true;
    });
    setLikesByPhoto(likeMap);
    setLoading(false);
  }

  useEffect(() => {
    loadPhotos();
  }, [user]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setUploadMediaType(isVideo ? 'video' : 'image');
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !user) return;
    setUploading(true);

    const fileExt = uploadFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('class-photos')
      .upload(fileName, uploadFile);

    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('class-photos').getPublicUrl(fileName);
    await supabase.from('class_photos').insert({
      uploaded_by: user.id,
      image_url: urlData.publicUrl,
      caption: caption.trim(),
      media_type: uploadMediaType,
    });

    setUploadFile(null);
    setUploadPreview(null);
    setUploadMediaType('image');
    setCaption('');
    setShowUpload(false);
    setUploading(false);
    await loadPhotos();
  }

  async function approvePhoto(photoId: string) {
    const { error } = await supabase.rpc('approve_class_photo', { p_photo_id: photoId });
    if (error) { alert(error.message); return; }
    await loadPhotos();
  }

  async function rejectPhoto(photoId: string) {
    const { error } = await supabase.rpc('reject_class_photo', { p_photo_id: photoId });
    if (error) { alert(error.message); return; }
    await loadPhotos();
  }

  async function deletePhoto(photoId: string, imageUrl: string) {
    if (!confirm('Delete this memory?')) return;
    const path = imageUrl.split('/class-photos/')[1];
    if (path) {
      await supabase.storage.from('class-photos').remove([path]);
    }
    await supabase.from('class_photos').delete().eq('id', photoId);
    await loadPhotos();
    setLightboxPhoto(null);
  }

  async function toggleLike(photoId: string) {
    const existing = likesByPhoto[photoId];
    if (existing?.liked) {
      await supabase.from('class_photo_likes').delete().eq('photo_id', photoId).eq('user_id', user!.id);
    } else {
      await supabase.from('class_photo_likes').insert({ photo_id: photoId, user_id: user!.id });
    }
    await loadPhotos();
  }

  const pendingCount = photos.filter((p) => p.status === 'pending').length;

  const visiblePhotos = photos.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'approved') return p.status === 'approved';
    return true;
  });

  const canSeePending = profile?.is_admin;
  const showFilterTabs = canSeePending || photos.some((p) => p.uploaded_by === user?.id && p.status !== 'approved');

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-serif text-xl font-bold text-gray-900">Memories</h2>
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Memory
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Photos and videos from our time together. All uploads are reviewed by an admin before appearing in the gallery.
        </p>

        {/* Filter tabs */}
        {showFilterTabs && (
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-4 w-fit">
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'approved' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              Gallery
            </button>
            {canSeePending && (
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  filter === 'pending' ? 'bg-accent-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Pending{pendingCount > 0 && ` (${pendingCount})`}
              </button>
            )}
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === 'all' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              All
            </button>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading memories...
          </div>
        ) : visiblePhotos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {filter === 'pending' ? 'No memories pending review' : 'No memories yet. Upload one to share!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {visiblePhotos.map((photo) => {
              const uploader = allProfiles[photo.uploaded_by];
              const likeInfo = likesByPhoto[photo.id];
              const isVideo = photo.media_type === 'video';
              return (
                <div
                  key={photo.id}
                  className="relative group rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 cursor-pointer"
                  onClick={() => photo.status === 'approved' && setLightboxPhoto(photo)}
                >
                  <div className="aspect-square overflow-hidden relative">
                    {isVideo ? (
                      <>
                        <video
                          src={photo.image_url}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          muted
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                            <Video className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <img
                        src={photo.image_url}
                        alt={photo.caption || 'Class photo'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>

                  {photo.status !== 'approved' && (
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      photo.status === 'pending'
                        ? 'bg-accent-100 text-accent-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {photo.status === 'pending' ? 'Pending' : 'Rejected'}
                    </div>
                  )}

                  {photo.status === 'approved' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(photo.id); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-all"
                    >
                      <Heart className={`w-4 h-4 ${likeInfo?.liked ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
                    </button>
                  )}

                  <div className="p-2.5">
                    {photo.caption && (
                      <p className="text-xs text-gray-600 truncate mb-1">{photo.caption}</p>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Avatar profile={uploader ?? null} size="sm" className="!w-5 !h-5 !text-[8px]" />
                      <span className="text-xs text-gray-400 truncate">{uploader?.display_name ?? 'Unknown'}</span>
                      {likeInfo && likeInfo.count > 0 && (
                        <span className="ml-auto text-xs text-gray-400 flex items-center gap-0.5">
                          <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                          {likeInfo.count}
                        </span>
                      )}
                    </div>
                  </div>

                  {photo.status === 'pending' && canSeePending && (
                    <div className="flex gap-1 p-2 bg-gray-50 border-t border-gray-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); approvePhoto(photo.id); }}
                        className="flex-1 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); rejectPhoto(photo.id); }}
                        className="flex-1 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-medium flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Reject
                      </button>
                    </div>
                  )}

                  {(photo.uploaded_by === user?.id || canSeePending) && photo.status !== 'pending' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id, photo.image_url); }}
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-serif text-lg font-bold text-gray-900">Upload Memory</h3>
              <button onClick={() => { setShowUpload(false); setUploadFile(null); setUploadPreview(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              {!uploadPreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-12 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-colors flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-medium">Click to select a photo or video</span>
                  <span className="text-xs text-gray-400">JPG, PNG, MP4, MOV up to 50 MB</span>
                </button>
              ) : (
                <div className="relative">
                  {uploadMediaType === 'video' ? (
                    <video src={uploadPreview} controls className="w-full h-56 object-cover rounded-xl" />
                  ) : (
                    <img src={uploadPreview} alt="Preview" className="w-full h-56 object-cover rounded-xl" />
                  )}
                  <button
                    type="button"
                    onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploadPreview && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Caption (optional)</label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Add a caption..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-lg p-3">
                    Your {uploadMediaType === 'video' ? 'video' : 'photo'} will be reviewed by an admin before appearing in the gallery.
                  </p>
                </>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowUpload(false); setUploadFile(null); setUploadPreview(null); }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Uploading...' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fade-in p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10">
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            {lightboxPhoto.media_type === 'video' ? (
              <video
                src={lightboxPhoto.image_url}
                controls
                autoPlay
                className="w-full max-h-[75vh] object-contain rounded-xl"
              />
            ) : (
              <img src={lightboxPhoto.image_url} alt={lightboxPhoto.caption} className="w-full max-h-[75vh] object-contain rounded-xl" />
            )}
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="flex items-center gap-2">
                <Avatar profile={allProfiles[lightboxPhoto.uploaded_by] ?? null} size="md" />
                <div>
                  <p className="text-white text-sm font-medium">{allProfiles[lightboxPhoto.uploaded_by]?.display_name ?? 'Unknown'}</p>
                  <p className="text-white/50 text-xs">{new Date(lightboxPhoto.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => toggleLike(lightboxPhoto.id)}
                className="flex items-center gap-2 text-white hover:text-red-400 transition-colors"
              >
                <Heart className={`w-6 h-6 ${likesByPhoto[lightboxPhoto.id]?.liked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-sm">{likesByPhoto[lightboxPhoto.id]?.count ?? 0}</span>
              </button>
            </div>
            {lightboxPhoto.caption && (
              <p className="text-white/80 text-sm mt-3 px-2">{lightboxPhoto.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
