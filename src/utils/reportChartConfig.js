/**
 * Chart configuration constants for member card reports
 */

export const RESOLUTION_OPTIONS = [
  { value: 'day',     label: 'Daily' },
  { value: 'week',    label: 'Weekly' },
  { value: 'month',   label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
];

// Maximum date range limits for each resolution type (in days)
export const REPORTS_MAX_DATE_RANGE = {
  day:     90,   // 90 days max for daily resolution
  week:    84,   // 12 weeks max for weekly resolution (12 * 7 = 84 days)
  month:   365,  // 12 months max for monthly resolution (~365 days)
  quarter: 365,  // 4 quarters max for quarterly resolution (~365 days)
};

// Range options for each resolution type
export const RANGE_OPTIONS_BY_RESOLUTION = {
  day: [
    { label: '7D',  days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
  ],
  week: [
    { label: '4W',  days: 28 },
    { label: '8W',  days: 56 },
    { label: '12W', days: 84 },
  ],
  month: [
    { label: '3M',  days: 90 },
    { label: '6M',  days: 180 },
    { label: '12M', days: 365 },
  ],
  quarter: [
    { label: '1Q',  days: 90 },
    { label: '2Q',  days: 180 },
    { label: '4Q',  days: 365 },
  ],
};

// Legacy export for backward compatibility (defaults to daily)
export const RANGE_OPTIONS = RANGE_OPTIONS_BY_RESOLUTION.day;

// Point flow chart configuration
export const POS_KEYS = [
  'points_earned',
  'points_added',
  'points_refunded',
  'points_returned',
  'points_unlocked',
];

export const NEG_KEYS = [
  'points_spent',
  'points_subtracted',
  'points_expired',
  'points_locked',
];

export const FLOW_COLORS = {
  points_earned:     'var(--color-success)',
  points_added:      'var(--color-info)',
  points_refunded:   'color-mix(in oklch, var(--color-success) 60%, white)',
  points_returned:   'color-mix(in oklch, var(--color-info) 60%, white)',
  points_unlocked:   'var(--color-primary)',
  points_spent:      'var(--color-error)',
  points_subtracted: 'var(--color-warning)',
  points_expired:    'color-mix(in oklch, var(--color-base-content) 35%, transparent)',
  points_locked:     'color-mix(in oklch, var(--color-warning) 60%, black)',
};

export const FLOW_LABELS = {
  points_earned:     'Earned',
  points_added:      'Added',
  points_refunded:   'Refunded',
  points_returned:   'Returned',
  points_unlocked:   'Unlocked',
  points_spent:      'Spent',
  points_subtracted: 'Subtracted',
  points_expired:    'Expired',
  points_locked:     'Locked',
};

// Pending points chart configuration
export const PENDING_SERIES = [
  { key: 'pending_points_total',     label: 'Total',     color: 'var(--color-warning)' },
  { key: 'pending_points_activated', label: 'Activated', color: 'var(--color-success)' },
  { key: 'pending_points_canceled',  label: 'Canceled',  color: 'var(--color-error)' },
];

// Zero-valued record used for buckets the API did not return
export const ZERO_RECORD = {
  points_total: 0, points_earned: 0, points_added: 0, points_subtracted: 0,
  points_expired: 0, points_spent: 0, points_refunded: 0, points_returned: 0,
  points_locked: 0, points_unlocked: 0,
  pending_points_total: 0, pending_points_activated: 0, pending_points_canceled: 0,
  object: 'card_daily_report',
};
