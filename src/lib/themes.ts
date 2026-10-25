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
    id: 'alpine-lake',
    name: 'Alpine Lake Dawn',
    category: 'Landscape',
    url: 'https://images.pexels.com/photos/13308077/pexels-photo-13308077.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-slate-900/20 to-blue-900/10',
  },
  {
    id: 'misty-lake',
    name: 'Misty Lake Morning',
    category: 'Landscape',
    url: 'https://images.pexels.com/photos/34713459/pexels-photo-34713459.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-slate-900/20 to-gray-800/10',
  },
  {
    id: 'sunset-lake',
    name: 'Lakeside Sunset',
    category: 'Landscape',
    url: 'https://images.pexels.com/photos/10525482/pexels-photo-10525482.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-orange-900/20 to-rose-900/10',
  },
  {
    id: 'autumn-path',
    name: 'Autumn Forest Path',
    category: 'Nature',
    url: 'https://images.pexels.com/photos/1437601/pexels-photo-1437601.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-amber-950/25 to-orange-900/10',
  },
  {
    id: 'autumn-mist',
    name: 'Misty Autumn Trail',
    category: 'Nature',
    url: 'https://images.pexels.com/photos/9782160/pexels-photo-9782160.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-amber-950/25 to-orange-950/10',
  },
  {
    id: 'waterfall',
    name: 'Jungle Waterfall',
    category: 'Nature',
    url: 'https://images.pexels.com/photos/17233021/pexels-photo-17233021.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-emerald-950/25 to-green-900/10',
  },
  {
    id: 'jungle-falls',
    name: 'Tropical Cascade',
    category: 'Nature',
    url: 'https://images.pexels.com/photos/5769326/pexels-photo-5769326.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-emerald-950/25 to-teal-900/10',
  },
  {
    id: 'desert-dunes',
    name: 'Golden Dunes',
    category: 'Landscape',
    url: 'https://images.pexels.com/photos/998635/pexels-photo-998635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-amber-950/25 to-orange-900/10',
  },
  {
    id: 'desert-sunset',
    name: 'Desert Sunset',
    category: 'Landscape',
    url: 'https://images.pexels.com/photos/28639291/pexels-photo-28639291.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-orange-950/25 to-amber-900/10',
  },
  {
    id: 'ocean-waves',
    name: 'Turquoise Waves',
    category: 'Ocean',
    url: 'https://images.pexels.com/photos/7267675/pexels-photo-7267675.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-cyan-950/20 to-blue-900/10',
  },
  {
    id: 'ocean-shore',
    name: 'Ocean Shore',
    category: 'Ocean',
    url: 'https://images.pexels.com/photos/4658458/pexels-photo-4658458.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-cyan-950/20 to-teal-900/10',
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    category: 'Floral',
    url: 'https://images.pexels.com/photos/4036990/pexels-photo-4036990.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-pink-950/20 to-rose-900/10',
  },
  {
    id: 'blossom-spring',
    name: 'Spring Blossoms',
    category: 'Floral',
    url: 'https://images.pexels.com/photos/4017653/pexels-photo-4017653.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-pink-950/20 to-rose-900/10',
  },
  {
    id: 'lavender-field',
    name: 'Lavender Field',
    category: 'Floral',
    url: 'https://images.pexels.com/photos/2676747/pexels-photo-2676747.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-purple-950/20 to-violet-900/10',
  },
  {
    id: 'lavender-bloom',
    name: 'Lavender Bloom',
    category: 'Floral',
    url: 'https://images.pexels.com/photos/12645380/pexels-photo-12645380.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-purple-950/20 to-indigo-900/10',
  },
  {
    id: 'aurora',
    name: 'Northern Lights',
    category: 'Night Sky',
    url: 'https://images.pexels.com/photos/28237726/pexels-photo-28237726.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-emerald-950/25 to-slate-900/15',
  },
  {
    id: 'aurora-glow',
    name: 'Aurora Glow',
    category: 'Night Sky',
    url: 'https://images.pexels.com/photos/23995635/pexels-photo-23995635.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    overlay: 'from-emerald-950/25 to-teal-950/15',
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
