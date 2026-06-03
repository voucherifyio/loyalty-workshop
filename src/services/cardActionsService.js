import { api } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

/**
 * Adjust points for a card (add or subtract)
 * @param {string} programId 
 * @param {string} memberId 
 * @param {string} cardId 
 * @param {number} points - Positive to add, negative to subtract
 * @param {string} [reason] - Optional reason for adjustment
 * @returns {Promise<void>}
 */
export async function adjustPoints(programId, memberId, cardId, points, reason) {
  await api.post(
    endpoints.members.adjustPoints(programId, memberId, cardId),
    {
      points,
      reason: reason || undefined,
    },
  );
}

/**
 * Activate pending points bucket
 * @param {string} programId 
 * @param {string} memberId 
 * @param {string} cardId 
 * @param {string} bucketId 
 * @returns {Promise<void>}
 */
export async function activatePending(programId, memberId, cardId, bucketId) {
  await api.post(
    endpoints.members.activatePendingPoints(
      programId,
      memberId,
      cardId,
      bucketId,
    ),
    {},
  );
}

/**
 * Cancel pending points bucket
 * @param {string} programId 
 * @param {string} memberId 
 * @param {string} cardId 
 * @param {string} bucketId 
 * @returns {Promise<void>}
 */
export async function cancelPending(programId, memberId, cardId, bucketId) {
  await api.post(
    endpoints.members.cancelPendingPoints(
      programId,
      memberId,
      cardId,
      bucketId,
    ),
    {},
  );
}

/**
 * Expire points bucket immediately
 * @param {string} programId 
 * @param {string} memberId 
 * @param {string} cardId 
 * @param {string} bucketId 
 * @returns {Promise<void>}
 */
export async function expirePoints(programId, memberId, cardId, bucketId) {
  await api.post(
    endpoints.members.expirePoints(programId, memberId, cardId, bucketId),
    {},
  );
}

/**
 * Refund a reward purchase
 * @param {string} programId 
 * @param {string} txId - Transaction ID
 * @param {{refund: string, stock: string}} policies - Refund and stock policies
 * @returns {Promise<void>}
 */
export async function refundRewardPurchase(programId, txId, policies) {
  await api.post(endpoints.members.refundRewardPurchase(programId, txId), {
    policies,
  });
}
