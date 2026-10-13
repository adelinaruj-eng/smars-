import { useState, useRef, useEffect } from 'react';
import { Camera, Save, Loader2, Check, Mail, Calendar, Shield, Link2, Palette, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from '@/components/Avatar';
import { ThemePicker } from '@/components/ThemePicker';
import { DEFAULT_THEME_ID } from '@/lib/themes';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
  const [chatTheme, setChatTheme] = useState(profile?.chat_theme ?? DEFAULT_THEME_ID);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noAdminExists, setNoAdminExists] = useState(false);
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlSaving, setUrlSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function checkAdmin() {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true);
      setNoAdminExists(count === 0);
    }
    checkAdmin();
  }, [profile?.is_admin]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB');
      return;
    }

    setUploading(true);
    setError(null);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    if (avatarUrl) {
      const oldPath = avatarUrl.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setAvatarUrl(publicUrl);
      await refreshProfile();
    }
    setUploading(false);
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim() || !user) return;

    let url = urlInput.trim();
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid image URL (e.g. https://...)');
      return;
    }

    setUrlSaving(true);
    setError(null);

    if (avatarUrl) {
      const oldPath = avatarUrl.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setAvatarUrl(url);
      setShowUrlInput(false);
      setUrlInput('');
      await refreshProfile();
    }
    setUrlSaving(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        display_name: displayName.trim(),
        bio: bio.trim(),
      })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  async function handleThemeChange(themeId: string) {
    if (!user) return;
    setChatTheme(themeId);
    await supabase.from('profiles').update({ chat_theme: themeId }).eq('id', user.id);
    await refreshProfile();
  }

  async function claimAdmin() {
    if (!user) return;
    setClaimingAdmin(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc('bootstrap_first_admin');
    if (rpcError) {
      setError(rpcError.message);
    } else {
      await refreshProfile();
      setNoAdminExists(false);
    }
    setClaimingAdmin(false);
  }

  const displayProfile = { ...profile, avatar_url: avatarUrl } as typeof profile;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">My Profile</h2>
        <p className="text-sm text-gray-500 mb-8">Update your photo and personal details</p>

        {/* Avatar section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Display Photo</h3>
          <div className="flex items-start gap-6 flex-col sm:flex-row sm:items-center">
            <div className="relative group">
              <Avatar profile={displayProfile} size="xl" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
            <div className="space-y-3 flex-1 w-full">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Use Image URL
                </button>
              </div>
              <p className="text-xs text-gray-400">Upload from your device, or paste a direct image link from the internet</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              {showUrlInput && (
                <form onSubmit={handleUrlSubmit} className="flex gap-2 animate-fade-in">
                  <div className="flex-1 relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={urlSaving || !urlInput.trim()}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {urlSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {urlSaving ? 'Saving' : 'Set'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                    className="px-2 py-2 text-gray-400 hover:text-gray-600 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
          {error && (
            <div className="mt-4 bg-red-50 text-red-600 text-sm rounded-lg p-3 border border-red-100">
              {error}
            </div>
          )}
        </div>

        {/* Chat Theme section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-primary-600" />
            <h3 className="text-sm font-semibold text-gray-700">Chat Background Theme</h3>
          </div>
          <p className="text-xs text-gray-400 mb-5">Choose a background image for your chat area. Changes apply instantly.</p>
          <ThemePicker currentTheme={chatTheme} onThemeChange={handleThemeChange} />
        </div>

        {/* Details form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h3 className="text-sm font-semibold text-gray-700">Personal Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Name shown in chats"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400 mt-1">This is the name other members will see</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell your classmates a bit about yourself..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{user?.email}</span>
            </div>
            {profile?.created_at && (
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            )}
            {profile?.is_admin && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent-50 text-accent-700 text-xs font-medium rounded-full">
                Administrator
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <span className="text-sm text-primary-600 flex items-center gap-1.5 animate-fade-in">
                <Check className="w-4 h-4" />
                Saved!
              </span>
            )}
          </div>
        </form>

        {/* Bootstrap admin */}
        {noAdminExists && !profile?.is_admin && (
          <div className="mt-6 bg-accent-50 border border-accent-200 rounded-2xl p-6 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-accent-100 text-accent-700 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-accent-900">Become the First Administrator</h3>
                <p className="text-sm text-accent-700 mt-1 mb-3">
                  No admin has been set up yet. As the first member, you can claim admin access to manage the community.
                </p>
                <button
                  onClick={claimAdmin}
                  disabled={claimingAdmin}
                  className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-60 flex items-center gap-2"
                >
                  {claimingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  {claimingAdmin ? 'Claiming...' : 'Claim Admin Access'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
