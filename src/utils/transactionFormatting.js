/**
 * Shared formatting helpers for member transaction data.
 * Used by MemberDetailModal tabs and any component rendering tx tables.
 */

const NEGATIVE_TYPES = new Set([
  'SPENT', 'SUBTRACTED', 'EXPIRED', 'LOCKED',
  'POINTS_SPENT_ON_ORDER', 'POINTS_SPENT_ON_REWARD', 'ADMIN_DEBIT'
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
    POINTS_SPENT_ON_ORDER: 'badge-error', POINTS_SPENT_ON_REWARD: 'badge-error',
    ADMIN_DEBIT: 'badge-error', ADMIN_CREDIT: 'badge-success'
  };
  return colors[type] || 'badge-neutral';
}

/**
 * Returns a DaisyUI badge class for tier transaction types.
 * Always returns a `badge-*` class suitable for `<span class="badge {getTierTxTypeColor(type)}">`.
 */
export function getTierTxTypeColor(type) {
  const colors = {
    JOINED: 'badge-success',
    UPGRADED: 'badge-success',
    PROLONGED: 'badge-info',
    DOWNGRADED: 'badge-warning',
    LEFT: 'badge-error'
  };
  return colors[type] || 'badge-neutral';
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
