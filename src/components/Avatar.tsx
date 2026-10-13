import type { Profile } from '@/lib/types';

interface AvatarProps {
  profile: Pick<Profile, 'avatar_url' | 'display_name' | 'full_name' | 'id'> | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

const dotSizes = {
  sm: 'w-2 h-2 border-[1.5px]',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3.5 h-3.5 border-2',
  xl: 'w-5 h-5 border-[3px]',
};

// Decorative gradient presets — each is a pair of colors for a rich gradient
const GRADIENT_PRESETS: { from: string; to: string; accent: string }[] = [
  { from: '#3b82f6', to: '#1e3a8a', accent: '#60a5fa' },   // ocean blue
  { from: '#10b981', to: '#065f46', accent: '#6ee7b7' },   // emerald
  { from: '#f59e0b', to: '#b45309', accent: '#fcd34d' },   // amber gold
  { from: '#ef4444', to: '#991b1b', accent: '#fca5a5' },   // rose red
  { from: '#8b5cf6', to: '#5b21b6', accent: '#c4b5fd' },   // violet — only used if name hashes to it
  { from: '#06b6d4', to: '#155e75', accent: '#67e8f9' },   // cyan teal
  { from: '#ec4899', to: '#9d174d', accent: '#f9a8d4' },   // pink magenta
  { from: '#84cc16', to: '#365314', accent: '#bef264' },   // lime green
  { from: '#f97316', to: '#9a3412', accent: '#fdba74' },   // orange
  { from: '#14b8a6', to: '#115e59', accent: '#5eead4' },   // teal
  { from: '#6366f1', to: '#3730a3', accent: '#a5b4fc' },   // indigo
  { from: '#0ea5e9', to: '#075985', accent: '#7dd3fc' },   // sky blue
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getGradient(id: string): { from: string; to: string; accent: string } {
  return GRADIENT_PRESETS[hashString(id) % GRADIENT_PRESETS.length];
}

function getInitials(profile: Pick<Profile, 'display_name' | 'full_name'> | null): string {
  return (profile?.display_name || profile?.full_name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ profile, size = 'md', className = '', showStatus = false, isOnline = false }: AvatarProps) {
  const initials = getInitials(profile);
  const gradient = profile ? getGradient(profile.id) : GRADIENT_PRESETS[0];
  const uid = `avatar-grad-${profile?.id ?? 'unknown'}`;

  return (
    <div className={`relative inline-block ${className}`}>
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.display_name || profile.full_name}
          className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white/50`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold ring-2 ring-white/60 relative overflow-hidden`}
          style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
        >
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <radialGradient id={`${uid}-glow`} cx="30%" cy="25%" r="60%">
                <stop offset="0%" stopColor={gradient.accent} stopOpacity="0.8" />
                <stop offset="100%" stopColor={gradient.accent} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${uid}-glow)`} />
            <circle cx="75" cy="75" r="30" fill={gradient.accent} opacity="0.15" />
            <circle cx="20" cy="80" r="18" fill={gradient.accent} opacity="0.1" />
          </svg>
          <span className="relative z-10 text-white drop-shadow-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
            {initials}
          </span>
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-white ${
            isOnline ? 'bg-green-500' : 'bg-gray-400'
          }`}
        />
      )}
    </div>
  );
}
