/**
 * Chart configuration constants for program spending reports
 */

// Transaction count series (success_on_reward + success_on_order = success)
export const TRANSACTION_SERIES = [
  { key: 'success_on_reward', label: 'Rewards', color: 'var(--color-primary)' },
  { key: 'success_on_order',  label: 'Orders',  color: 'var(--color-info)' },
];

// Points spent series (points_on_rewards + points_on_order = points)
export const POINTS_SERIES = [
  { key: 'points_on_rewards', label: 'Rewards', color: 'var(--color-primary)' },
  { key: 'points_on_order',   label: 'Orders',  color: 'var(--color-info)' },
];

// Amount series (amount spent on orders)
export const AMOUNT_SERIES = [
  { key: 'amount_on_order', label: 'Order Amount', color: 'var(--color-success)' },
];

// Zero-valued record for gap filling
export const ZERO_RECORD = {
  success: 0,
  success_on_reward: 0,
  success_on_order: 0,
  points: 0,
  points_on_rewards: 0,
  points_on_order: 0,
  amount_on_order: 0,
  object: 'spending_daily_report',
};
