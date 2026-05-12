/**
 * Shared formatting helpers for member transaction data.
 * Used by MemberDetailModal tabs and any component rendering tx tables.
 */

export const NEGATIVE_TYPES = new Set([
  'SPENT', 'SUBTRACTED', 'EXPIRED', 'LOCKED',
  'POINTS_SPENT_ON_ORDER', 'POINTS_SPENT_ON_REWARD'
]);

/** Returns a signed point total for a transaction (negative for deductions). */
export function getSignedPoints(tx) {
  const raw = tx.details?.points?.total || 0;
  if (raw === 0) return 0;
  return NEGATIVE_TYPES.has(tx.type) ? -Math.abs(raw) : Math.abs(raw);
}

/**
 * Returns a DaisyUI badge class for a transaction type.
 * Always returns a `badge-*` class suitable for `<span class="badge {getTxTypeColor(type)}">`.
 */
export function getTxTypeColor(type) {
  const colors = {
    EARNED: 'badge-success', ADDED: 'badge-info', SPENT: 'badge-error',
    SUBTRACTED: 'badge-warning', EXPIRED: 'badge-ghost', REFUNDED: 'badge-success',
    RETURNED: 'badge-info', LOCKED: 'badge-warning', UNLOCKED: 'badge-info',
    POINTS_SPENT_ON_ORDER: 'badge-error', POINTS_SPENT_ON_REWARD: 'badge-error'
  };
  return colors[type] || 'badge-neutral';
}

/**
 * Returns a DaisyUI badge class for a transaction/reward status.
 * Always returns a `badge-*` class.
 */
export function getStatusColor(status) {
  const colors = {
    APPROVED: 'badge-success', REJECTED: 'badge-error',
    PENDING: 'badge-warning', PROCESSING: 'badge-warning', PROCESSED: 'badge-info'
  };
  return colors[status] || 'badge-neutral';
}

/** Formats a cent amount to a dollar string, e.g. 1099 → "$10.99". */
export function formatAmount(cents) {
  if (cents == null) return 'N/A';
  return `$${(cents / 100).toFixed(2)}`;
}

/** Formats a date string to locale date, returns '–' for null/invalid.
 *  Accepts plain strings ("2026-04-29", ISO datetime) or objects with a
 *  nested `date` property ({ date: "2026-04-29" }). */
export function formatDate(dateStr) {
  if (!dateStr) return '–';
  // Unwrap { date: "..." } shaped objects returned by some API fields
  const raw = (typeof dateStr === 'object' && typeof dateStr.date === 'string')
    ? dateStr.date
    : dateStr;
  if (!raw || typeof raw !== 'string') return '–';
  // Date-only strings (YYYY-MM-DD) must be parsed as local time, not UTC,
  // to prevent off-by-one day shifts in non-UTC timezones.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, d] = raw.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString();
  }
  const dt = new Date(raw);
  return isNaN(dt.getTime()) ? '–' : dt.toLocaleDateString();
}

/** Formats a date string to locale date+time, returns '–' for null/invalid. */
export function formatDateTime(dateStr) {
  if (!dateStr) return '–';
  const dt = new Date(dateStr);
  return isNaN(dt.getTime()) ? '–' : dt.toLocaleString();
}

/** Formats a number with locale separators, returns '–' for null. */
export function formatNum(n) {
  if (n == null) return '–';
  return Number(n).toLocaleString();
}
