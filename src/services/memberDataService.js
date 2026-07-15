import { api } from '../api/client.js';
import { endpoints } from '../api/endpoints.js';

/**
 * Fetch member details
 * @param {string} programId 
 * @param {string} memberId 
 * @returns {Promise<Object>} Membership data with member, program, and cards
 */
export async function fetchMember(programId, memberId) {
  return await api.get(
    endpoints.memberships.get(programId, memberId, { identification_type: 'member_id' })
  );
}

/**
 * Fetch all loyalty memberships for a customer across programs, in a single call.
 * @param {string} identifier - value to resolve, meaning depends on `identificationType`
 * @param {'customer_id'|'customer_source_id'|'member_id'} identificationType
 * @returns {Promise<Object>} `{ object, customer, memberships[] }`
 */
export async function fetchCustomerMemberships(identifier, identificationType = 'customer_id') {
  return await api.get(
    endpoints.memberships.list(identifier, { identification_type: identificationType })
  );
}

/**
 * Fetch card overview data (pending and expiring buckets)
 * @param {string} programId 
 * @param {string} memberId 
 * @param {string} cardId 
 * @returns {Promise<{pendingBuckets: Array, expiringBuckets: Array}>}
 */
export async function fetchCardOverview(programId, memberId, cardId) {
  const [pendingRes, expiringRes] = await Promise.all([
    api
      .get(endpoints.members.pendingPoints(programId, memberId, cardId))
      .catch(() => ({ data: [] })),
    api
      .get(endpoints.members.expiringPoints(programId, memberId, cardId))
      .catch(() => ({ data: [] })),
  ]);

  return {
    pendingBuckets: pendingRes.data || [],
    expiringBuckets: expiringRes.data || [],
  };
}

/**
 * Fetch member activities
 * @param {string} programId 
 * @param {string} memberId 
 * @returns {Promise<Array>} Array of activities
 */
export async function fetchMemberActivities(programId, memberId) {
  const res = await api.get(endpoints.members.activities(programId, memberId));
  return res.data || [];
}

/**
 * Fetch card activities
 * @param {string} programId 
 * @param {string} memberId 
 * @param {string} cardId 
 * @returns {Promise<Array>} Array of card activities
 */
export async function fetchCardActivities(programId, memberId, cardId) {
  const res = await api.get(
    endpoints.members.cardActivities(programId, memberId, cardId),
  );
  return res.data || [];
}

/**
 * Fetch and merge card transactions from multiple sources
 * Links child card transactions to rewards/orders and sorts by date
 * @param {string} programId 
 * @param {string} memberId 
 * @param {string} cardId 
 * @returns {Promise<Array>} Array of merged transactions with _source field
 */
export async function fetchCardTransactions(programId, memberId, cardId) {
  const [cardRes, rewardRes, orderRes] = await Promise.all([
    api.get(
      endpoints.members.cardTransactions(programId, memberId, cardId, {
        limit: 50,
      }),
    ),
    api.get(
      endpoints.members.rewardPurchases(programId, memberId, { limit: 50 }),
    ),
    api.get(
      endpoints.members.orderPayments(programId, memberId, { limit: 50 }),
    ),
  ]);

  const allCardTxs = (cardRes.data || []).map((t) => ({
    ...t,
    _source: 'Card',
  }));

  const allRewards = rewardRes.data || [];
  const allOrders = orderRes.data || [];
  
  const rewardTxs = allRewards
    .filter((r) => r.card_id === cardId)
    .map((t) => ({ ...t, _source: 'Reward' }));
  
  const orderTxs = allOrders
    .filter((o) => o.card_id === cardId)
    .map((t) => ({ ...t, _source: 'Order' }));

  // Link child card transactions to rewards/orders
  const cardTxById = {};
  for (const ct of allCardTxs) cardTxById[ct.id] = ct;
  
  const consumedCardTxIds = new Set();
  for (const tx of [...rewardTxs, ...orderTxs]) {
    if (tx.card_transaction_id && cardTxById[tx.card_transaction_id]) {
      tx._childCardTx = cardTxById[tx.card_transaction_id];
      consumedCardTxIds.add(tx.card_transaction_id);
    }
  }

  const all = [
    ...allCardTxs.filter((ct) => !consumedCardTxIds.has(ct.id)),
    ...rewardTxs,
    ...orderTxs,
  ];
  
  all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  return all;
}

/**
 * Fetch and merge member transactions (benefit and tier)
 * @param {string} programId 
 * @param {string} memberId 
 * @returns {Promise<Array>} Array of merged transactions with _source field
 */
export async function fetchMemberTransactions(programId, memberId) {
  const [benefitRes, tierRes] = await Promise.all([
    api.get(
      endpoints.members.benefitTransactions(programId, memberId, {
        limit: 50,
      }),
    ),
    api.get(
      endpoints.members.tierTransactions(programId, memberId, {
        limit: 50,
      }),
    ),
  ]);

  const benefitTxs = (benefitRes.data || []).map((t) => ({
    ...t,
    _source: 'Benefit',
  }));
  
  const tierTxs = (tierRes.data || []).map((t) => ({
    ...t,
    _source: 'Tier',
  }));

  const all = [...benefitTxs, ...tierTxs];
  all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  return all;
}
