/**
 * Formats a date string (ISO timestamp or YYYY-MM-DD) into a clean, doctor-friendly format.
 * Examples:
 * - '18 Sep 2026'
 * - 'Today'
 * - 'Yesterday'
 * - '18 Sep 2026 (2 days ago)'
 */
export function formatPatientVisitDate(dateStr?: string | null, includeRelative = true): string {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = date.getDate();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const formattedDate = `${day} ${month} ${year}`;

  if (!includeRelative) return formattedDate;

  const now = new Date();
  const dMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((nowMidnight.getTime() - dMidnight.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays > 1 && diffDays <= 7) {
    return `${formattedDate} (${diffDays} days ago)`;
  }

  return formattedDate;
}
