/**
 * Date Formatting & Manipulation Utilities
 * Consistent representation across Indian society operations.
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Formats a date into "DD MMM YYYY" (e.g. "15 Oct 2026")
 */
export function formatDate(date: string | number | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);

  const day = d.getDate().toString().padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Formats a date into "DD MMM YYYY, HH:mm"
 */
export function formatDateTime(date: string | number | Date | null | undefined): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);

  const formattedDate = formatDate(d);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  return `${formattedDate}, ${hours}:${minutes} ${ampm}`;
}

/**
 * Formats relative time (e.g. "2 hours ago", "Yesterday", "3 days ago")
 */
export function formatTimeAgo(date: string | number | Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(d);
}

/**
 * Returns current month & year in "Month YYYY" format (e.g. "October 2026")
 */
export function getCurrentBillingMonth(): string {
  const now = new Date();
  return `${FULL_MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}
