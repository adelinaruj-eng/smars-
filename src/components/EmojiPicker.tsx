import { useState, useRef, useEffect } from 'react';
import { Smile, Sticker } from 'lucide-react';

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😨', '😬', '🥺', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'],
  },
  {
    name: 'Gestures',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🙏', '🤝', '💪', '🫶', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  },
  {
    name: 'Objects',
    emojis: ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💽', '💾', '💿', '📀', '📷', '📸', '📹', '🎥', '🎬', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '⚖️', '🪜', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪚', '🔩', '⚙️', '🪤', '🧱', '⛓️', '🧲', '🔫'],
  },
  {
    name: 'Nature',
    emojis: ['🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '💐', '🌼', '🪷', '🌵', '🌴', '🌳', '🌲', '🍀', '🌿', '🍃', '🌱', '🪴', '🌾', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌊', '💧', '🔥', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🌌', '🌙', '🌍', '🌎', '🌏', '🪐', '💫'],
  },
  {
    name: 'Food',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍮', '🍯', '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥃', '🍷', '🥂'],
  },
  {
    name: 'Activities',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
  },
  {
    name: 'Symbols',
    emojis: ['✅', '❌', '❎', '✔️', '☑️', '🔵', '🟠', '🟡', '🟢', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔔', '🔕', '🚫', '❓', '❗', '‼️', '⁉️', '💬', '💭', '🗯️', '♻️', '⚠️', '⚡', '🚨', '🔞', '📶', '🆗', '🆕', '🆒', '🆓', '🔊', '🔇', '📢', '🔉', '🔈'],
  },
];

const STICKER_PACKS: { name: string; stickers: string[] }[] = [
  {
    name: 'Expressions',
    stickers: ['😀', '😂', '🥰', '😎', '🤔', '😴', '🤯', '😱', '🥳', '😭', '😡', '🤗', '🤩', '🥺', '😏', '🤓', '😈', '👻', '🤡', '💩', '👍', '👎', '🙏', '💪', '👏', '🤝', '✌️', '🤞', '👋', '🫶', '💯', '🔥', '✨', '🎉', '🎊', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💕', '💖', '💘', '💝'],
  },
  {
    name: 'Animals',
    stickers: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🦮', '🐩', '🦕', '🦖'],
  },
  {
    name: 'Food & Drink',
    stickers: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🌽', '🥕', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🥗', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🍤', '🍙', '🍚', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍮', '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍷', '🥂', '🍾'],
  },
  {
    name: 'Nature & Travel',
    stickers: ['🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '💐', '🌼', '🪷', '🌵', '🌴', '🌳', '🌲', '🍀', '🌿', '🍃', '🌱', '🪴', '🌾', '🌈', '☀️', '⛅', '☁️', '🌧️', '⛈️', '❄️', '☃️', '⛄', '🌊', '💧', '🔥', '⭐', '🌟', '✨', '🌌', '🌙', '🌍', '🌎', '🌏', '🪐', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🌳', '🌴', '🌈', '🌅', '🌄', '🌇', '🌆', '🏙️', '🌃', '🌉', '🌁'],
  },
  {
    name: 'Activities',
    stickers: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '⛳', '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '🎿', '⛷️', '🏂', '🪂', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩', '🎉', '🎊', '🎈', '🎁', '🎀'],
  },
  {
    name: 'Objects',
    stickers: ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💾', '💿', '📀', '📷', '📸', '📹', '🎥', '🎬', '📺', '📻', '⏰', '🕰️', '⌛', '⏳', '🔋', '🔌', '💡', '🔦', '🕯️', '💸', '💵', '💴', '💶', '💷', '🪙', '💰', '💳', '💎', '🔧', '🔨', '🛠️', '⚙️', '🧲', '🔑', '🗝️', '🚪', '🛏️', '🛋️', '🚿', '🛁', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🚽', '🚰', ' shower', '🛁', '🪞', '🪟', '🛍️', '🛒', '🎁', '🎈', '🎀', '🪄', '🧨', '✨', '🎉', '🎊'],
  },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 z-50 animate-slide-up"
    >
      <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-thin">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === i ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      <div className="p-3 max-h-56 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-8 gap-1">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => onEmojiSelect(emoji)}
              className="w-8 h-8 flex items-center justify-center text-xl rounded-lg hover:bg-gray-100 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StickerPickerProps {
  onStickerSelect: (sticker: string) => void;
  onClose: () => void;
}

export function StickerPicker({ onStickerSelect, onClose }: StickerPickerProps) {
  const [activePack, setActivePack] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 z-50 animate-slide-up"
    >
      <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-thin">
        {STICKER_PACKS.map((pack, i) => (
          <button
            key={pack.name}
            onClick={() => setActivePack(i)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
              activePack === i ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400'
            }`}
          >
            {pack.name}
          </button>
        ))}
      </div>
      <div className="p-3 max-h-56 overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-4 gap-2">
          {STICKER_PACKS[activePack].stickers.map((sticker, i) => (
            <button
              key={i}
              onClick={() => {
                onStickerSelect(sticker);
                onClose();
              }}
              className="aspect-square flex items-center justify-center text-4xl rounded-xl hover:bg-gray-100 transition-all hover:scale-110 active:scale-95"
            >
              {sticker}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface EmojiInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSend?: () => void;
  onSticker?: (sticker: string) => void;
}

export function EmojiInput({ value, onChange, placeholder, onSend, onSticker }: EmojiInputProps) {
  const [showPicker, setShowPicker] = useState<'emoji' | 'sticker' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleEmoji(emoji: string) {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    onChange(newValue);
    input.focus();
    requestAnimationFrame(() => {
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  }

  return (
    <div className="flex items-center gap-1 flex-1 relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSend) onSend();
        }}
      />
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(showPicker === 'sticker' ? null : 'sticker')}
          className={`w-9 h-9 transition-colors flex items-center justify-center rounded-lg ${showPicker === 'sticker' ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-primary-600'}`}
          title="Stickers"
        >
          <Sticker className="w-5 h-5" />
        </button>
        {showPicker === 'sticker' && onSticker && (
          <StickerPicker
            onStickerSelect={(s) => { onSticker(s); setShowPicker(null); }}
            onClose={() => setShowPicker(null)}
          />
        )}
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(showPicker === 'emoji' ? null : 'emoji')}
          className={`w-9 h-9 transition-colors flex items-center justify-center rounded-lg ${showPicker === 'emoji' ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-primary-600'}`}
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>
        {showPicker === 'emoji' && (
          <EmojiPicker
            onEmojiSelect={handleEmoji}
            onClose={() => setShowPicker(null)}
          />
        )}
      </div>
    </div>
  );
}
