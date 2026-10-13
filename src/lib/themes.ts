export interface ChatTheme {
  id: string;
  name: string;
  category: string;
  url: string;
  overlay: string;
  isDefault?: boolean;
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: 'mountain',
    name: 'Mountain Sunrise',
    category: 'Landscape',
    url: 'https://images.pexels.com/photos/15249545/pexels-photo-15249545.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-gray-900/20 to-gray-900/10',
    isDefault: true,
  },
  {
    id: 'cathedral',
    name: 'Cathedral Arch',
    category: 'Architecture',
    url: 'https://images.pexels.com/photos/37423340/pexels-photo-37423340.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-primary-950/25 to-primary-900/10',
  },
  {
    id: 'beach',
    name: 'Tropical Calm',
    category: 'Landscape',
    url: 'https://images.pexels.com/photos/33021022/pexels-photo-33021022.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-blue-900/20 to-cyan-900/10',
  },
  {
    id: 'forest',
    name: 'Forest Canopy',
    category: 'Nature',
    url: 'https://images.pexels.com/photos/33170393/pexels-photo-33170393.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-green-950/25 to-green-900/10',
  },
  {
    id: 'starry',
    name: 'Starry Night',
    category: 'Night Sky',
    url: 'https://images.pexels.com/photos/956999/milky-way-starry-sky-night-sky-star-956999.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-indigo-950/30 to-slate-900/15',
  },
  {
    id: 'pastel',
    name: 'Soft Pastel',
    category: 'Abstract',
    url: 'https://images.pexels.com/photos/7130469/pexels-photo-7130469.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-pink-900/15 to-purple-900/10',
  },
  {
    id: 'plain',
    name: 'Clean Plain',
    category: 'Default',
    url: '',
    overlay: '',
  },
];

export const DEFAULT_THEME_ID = 'mountain';

export function getThemeById(id: string): ChatTheme {
  return CHAT_THEMES.find((t) => t.id === id) ?? CHAT_THEMES[0];
}
