export function formatLastSeen(timestamp: string | null): string {
  if (!timestamp) return 'Offline';

  const now = Date.now();
  const seen = new Date(timestamp).getTime();
  const diffMs = now - seen;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'Last seen just now';
  if (diffMin < 60) return `Last seen ${diffMin} min ago`;
  if (diffHrs < 24) return `Last seen ${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Last seen yesterday';
  if (diffDays < 7) return `Last seen ${diffDays} days ago`;

  const date = new Date(timestamp);
  return `Last seen ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}
