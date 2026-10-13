import { Check } from 'lucide-react';
import { CHAT_THEMES } from '@/lib/themes';

interface ThemePickerProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export function ThemePicker({ currentTheme, onThemeChange }: ThemePickerProps) {
  const categories = [...new Set(CHAT_THEMES.map((t) => t.category))];

  return (
    <div className="space-y-5">
      {categories.map((category) => (
        <div key={category}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2.5">
            {category}
          </p>
          <div className="grid grid-cols-3 gap-3">
            {CHAT_THEMES.filter((t) => t.category === category).map((theme) => {
              const selected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme.id)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-[4/3] ${
                    selected
                      ? 'border-primary-500 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {theme.url ? (
                    <img
                      src={theme.url}
                      alt={theme.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                      <span className="text-xs text-gray-400 font-medium">Plain</span>
                    </div>
                  )}
                  {selected && (
                    <div className="absolute inset-0 bg-primary-600/20 flex items-center justify-center">
                      <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 px-2 py-1">
                    <p className="text-[10px] text-white font-medium truncate">{theme.name}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
