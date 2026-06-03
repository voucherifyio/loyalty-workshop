/**
 * Get badge class for activity type
 * Centralized activity type color mapping
 * 
 * @param {string} type - Activity type
 * @returns {string} Badge class
 */
export function getActivityTypeColor(type) {
  const colors = {
    MEMBER_ENROLLED: 'badge-success',
    MEMBER_STATUS_CHANGED: 'badge-info',
    CARD_ISSUED: 'badge-success',
    CARD_STATUS_CHANGED: 'badge-info',
    TIER_JOINED: 'badge-success',
    TIER_UPGRADED: 'badge-success',
    TIER_DOWNGRADED: 'badge-warning',
    TIER_PROLONGED: 'badge-info',
    TIER_LEFT: 'badge-error',
    POINTS_EARNED: 'badge-success',
    POINTS_ADDED: 'badge-info',
    POINTS_SPENT: 'badge-error',
    POINTS_SUBTRACTED: 'badge-warning',
    POINTS_EXPIRED: 'badge-ghost',
    POINTS_REFUNDED: 'badge-success',
    POINTS_LOCKED: 'badge-warning',
    POINTS_UNLOCKED: 'badge-info',
    REWARD_PURCHASED: 'badge-success',
    REWARD_REFUNDED: 'badge-warning',
    ORDER_CREATED: 'badge-info',
    ORDER_PAID: 'badge-success',
    CUSTOM_EVENT: 'badge-info',
  };
  return colors[type] || 'badge-neutral';
}
