// Simple FNV-1a hash implementation for deterministic wish selection
export function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

// Get today's date in YYYY-MM-DD format
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get wish index deterministically based on fid and date
export function getWishIndex(fid: number | null, date: string, totalWishes: number): number {
  const seed = fid !== null ? `${fid}-${date}` : date;
  const hash = fnv1aHash(seed);
  return hash % totalWishes;
}

// Calculate percentages from vote counts
export function calculateVotePercentages(likes: number, dislikes: number): { likesPct: number; dislikesPct: number } {
  const total = likes + dislikes;
  if (total === 0) {
    return { likesPct: 0, dislikesPct: 0 };
  }
  const likesPct = Math.round((likes / total) * 100);
  const dislikesPct = 100 - likesPct;
  return { likesPct, dislikesPct };
}