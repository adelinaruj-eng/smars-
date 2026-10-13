import { getThemeById } from '@/lib/themes';

interface ChatBackgroundProps {
  themeId: string;
  children: React.ReactNode;
}

export function ChatBackground({ themeId, children }: ChatBackgroundProps) {
  const theme = getThemeById(themeId);

  if (!theme.url) {
    return <div className="flex-1 flex flex-col bg-gray-50 min-h-0 overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden bg-gray-100">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${theme.url})`,
          opacity: 0.35,
        }}
      />
      <div className={`absolute inset-0 bg-gradient-to-b ${theme.overlay}`} />
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
