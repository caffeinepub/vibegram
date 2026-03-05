import type { UserId } from "../backend.d";

/**
 * Format a bigint timestamp (nanoseconds) to a relative time string
 */
export function formatRelativeTime(timestamp: bigint): string {
  const nowMs = Date.now();
  const timestampMs = Number(timestamp / BigInt(1_000_000));
  const diffMs = nowMs - timestampMs;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  if (diffWeek < 4) return `${diffWeek}w`;
  return `${diffMonth}mo`;
}

/**
 * Get initials from a display name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format a count for display (e.g., 1234 -> "1.2K")
 */
export function formatCount(count: number): string {
  if (count < 1000) return count.toString();
  if (count < 1_000_000)
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

/**
 * Compare UserId (Principal) with current user identity principal string
 */
export function isSameUser(
  userId: UserId | undefined,
  principalString: string | undefined,
): boolean {
  if (!userId || !principalString) return false;
  return userId.toString() === principalString;
}

/**
 * Check if a userId is in a list of userIds
 */
export function includesUser(
  userIds: UserId[],
  targetId: UserId | undefined,
): boolean {
  if (!targetId) return false;
  return userIds.some((id) => id.toString() === targetId.toString());
}

/**
 * Generate a consistent gradient avatar color based on username
 */
export function getAvatarGradient(seed: string): string {
  const gradients = [
    "from-purple-500 to-pink-500",
    "from-pink-500 to-orange-400",
    "from-blue-500 to-purple-600",
    "from-cyan-400 to-blue-600",
    "from-violet-500 to-fuchsia-500",
    "from-rose-400 to-pink-600",
    "from-indigo-500 to-blue-500",
    "from-fuchsia-500 to-pink-500",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % gradients.length;
  }
  return gradients[Math.abs(hash) % gradients.length];
}
