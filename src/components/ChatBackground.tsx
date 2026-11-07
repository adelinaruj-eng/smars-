import { getThemeById } from '@/lib/themes';

const WALLPAPER_PATTERN = 'radial-gradient(rgba(134,150,160,0.08) 1px, transparent 1.5px)';

interface ChatBackgroundProps {
  themeId: string;
  children: React.ReactNode;
}

export function ChatBackground({ themeId, children }: ChatBackgroundProps) {
  const theme = getThemeById(themeId);

  if (!theme.url) {
    return (
      <div
        className="flex-1 flex flex-col bg-[#0b141a] min-h-0 overflow-hidden"
        style={{ backgroundImage: WALLPAPER_PATTERN, backgroundSize: '22px 22px' }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden bg-[#0b141a]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${theme.url})` }}
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.overlay}`} />
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
