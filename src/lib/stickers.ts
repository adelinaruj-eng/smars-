// Detects whether a message is a single emoji/sticker (one emoji, nothing else).
// Uses a runtime code-point check instead of a `\p{Extended_Pictographic}` regex,
// which older esbuild versions can't parse.
function isEmojiCodePoint(cp: number): boolean {
  return (
    (cp >= 0x1f000 && cp <= 0x1faff) || // symbols & pictographs, extended
    (cp >= 0x2600 && cp <= 0x27bf) ||   // misc symbols, dingbats
    (cp >= 0x2190 && cp <= 0x21ff) ||   // arrows
    (cp >= 0x2300 && cp <= 0x23ff) ||   // technical
    (cp >= 0x2b00 && cp <= 0x2bff) ||   // misc symbols & arrows
    (cp >= 0xfe00 && cp <= 0xfe0f) ||   // variation selectors
    cp === 0x200d                       // zero-width joiner
  );
}

export function isStickerMessage(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return false;
  // Iterate by code point so multi-byte emoji are handled correctly.
  let emojiCount = 0;
  for (const ch of trimmed) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    if (isEmojiCodePoint(cp)) {
      emojiCount++;
    } else if (cp > 0x20) {
      // Any non-emoji, non-whitespace char means it's not a pure sticker.
      return false;
    }
  }
  return emojiCount > 0;
}
