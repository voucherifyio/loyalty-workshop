/**
 * Chart configuration constants for program points-earnings reports
 */

// Points series (points + pending_points, stacked)
export const POINTS_SERIES = [
  { key: 'points',         label: 'Confirmed', color: 'var(--color-primary)' },
  { key: 'pending_points', label: 'Pending',    color: 'var(--color-warning)' },
];

// Earning events series (single series)
export const EVENTS_SERIES = [
  { key: 'success_count', label: 'Earning Events', color: 'var(--color-info)' },
];

// Zero-valued record for gap filling
export const ZERO_RECORD = {
  success_count: 0,
  points: 0,
  pending_points: 0,
  object: 'program_points_earnings_daily_report',
};
