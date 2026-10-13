import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '🙂‍↔️', '🙂‍↕️', '😨', '😬', '😮‍💨', '🥺', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'],
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
    emojis: ['🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '💐', '🌼', '🪷', ' pot_plant', '🌵', '🌴', '🌳', '🌲', '🌴', '🍀', '🌿', '🍃', '🌱', '🪴', '🌾', '🌷', '🌹', '🌺', '🌸', '🌼', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌊', '💧', '🔥', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🌌', '🌙', '🌍', '🌎', '🌏', '🪐', '💫'],
  },
  {
    name: 'Food',
    emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍬', '🍭', '🍮', '🍯', '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🥃', '🍷', '🥂', 'Cheers'],
  },
  {
    name: 'Activities',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩'],
  },
  {
    name: 'Symbols',
    emojis: ['✅', '❌', '❎', '✔️', '☑️', '🔵', '🟠', '🟡', '🟢', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔔', '🔕', '🚫', '✔️', '❓', '❗', '‼️', '⁉️', '💬', '💭', '🗯️', '⏰', '🔔', '📢', '📣', '🔔', '🔕', '♻️', '⚠️', '⚡', '🚨', '🔞', '📶', '🆗', '🆕', '🆒', '🆓', '🔊', '🔇', '📢', '🔉', '🔈'],
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

interface EmojiInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSend?: () => void;
}

export function EmojiInput({ value, onChange, placeholder, onSend }: EmojiInputProps) {
  const [showPicker, setShowPicker] = useState(false);
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
    <div className="flex items-center gap-2 flex-1 relative">
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
          onClick={() => setShowPicker(!showPicker)}
          className="w-9 h-9 text-gray-400 hover:text-primary-600 transition-colors flex items-center justify-center"
        >
          <Smile className="w-5 h-5" />
        </button>
        {showPicker && (
          <EmojiPicker
            onEmojiSelect={handleEmoji}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  );
}
