/**
 * Chart configuration constants for program earning-rules (trigger outcome) reports
 */

// Maps the API's `failures_breakdown` object keys to flat row fields.
// The service layer flattens each row's `failures_breakdown` using this map
// so the generic chart/KPI utilities can treat them like any other numeric field.
export const FAILURE_REASON_KEY_MAP = {
  COOLDOWN: 'failures_cooldown',
  FREQUENCY: 'failures_frequency',
  EARNING_LIMIT: 'failures_earning_limit',
};

// Trigger outcome series (success_count + failures_count, stacked)
export const OUTCOME_SERIES = [
  { key: 'success_count',  label: 'Success',  color: 'var(--color-success)' },
  { key: 'failures_count', label: 'Failures', color: 'var(--color-error)' },
];

// Failure reason breakdown series (flattened failures_breakdown, stacked)
export const FAILURE_REASON_SERIES = [
  { key: 'failures_cooldown',      label: 'Cooldown',      color: 'var(--color-warning)' },
  { key: 'failures_frequency',     label: 'Frequency',     color: 'var(--color-error)' },
  { key: 'failures_earning_limit', label: 'Earning Limit', color: 'color-mix(in oklch, var(--color-error) 60%, black)' },
];

// Zero-valued record for gap filling
export const ZERO_RECORD = {
  success_count: 0,
  failures_count: 0,
  failures_cooldown: 0,
  failures_frequency: 0,
  failures_earning_limit: 0,
  object: 'program_earning_rules_daily_report',
};
