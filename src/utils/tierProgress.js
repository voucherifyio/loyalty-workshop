/**
 * Calculate tier progress percentage
 * 
 * @param {number} current - Current points value
 * @param {number} min - Minimum points for current tier
 * @param {number} max - Maximum points for current tier
 * @returns {number} Progress percentage (0-100)
 */
export function calculateTierProgress(current, min, max) {
  // `min` is null when the member hasn't reached any tier yet.
  if (min == null) return 0;
  // `max` is null for an open-ended top tier (no upper bound) — treat as maxed out.
  if (max == null) return 100;
  if (max <= min) return 0;
  const progress = ((current - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, Math.round(progress)));
}
