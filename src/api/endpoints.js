// Loyalty V2 API endpoints organized by entity
import { withQuery } from './queryString.js';

export const endpoints = {
  // Health check
  ping: () => '/ping',

  // Programs
  programs: {
    list: (query = {}) => withQuery('/v2/loyalties/programs', query),
    get: (id) => `/v2/loyalties/programs/${id}`,
    create: () => '/v2/loyalties/programs',
    update: (id) => `/v2/loyalties/programs/${id}`,
    activate: (id) => `/v2/loyalties/programs/${id}/activate`,
    deactivate: (id) => `/v2/loyalties/programs/${id}/deactivate`,
    draft: (id) => `/v2/loyalties/programs/${id}/draft`,
    delete: (id) => `/v2/loyalties/programs/${id}`,
    activities: (id) => `/v2/loyalties/programs/${id}/activities`,

    // Program assignments (cursor-paginated lists, like all other list endpoints)
    cardDefinitions: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/card-definitions`, query),
    cardDefinitionsBatch: (id) => `/v2/loyalties/programs/${id}/card-definitions/batch`,
    earningRules: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/earning-rules`, query),
    earningRulesBatch: (id) => `/v2/loyalties/programs/${id}/earning-rules/batch`,
    rewards: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/rewards`, query),
    rewardsBatch: (id) => `/v2/loyalties/programs/${id}/rewards/batch`,
    tierStructures: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/tier-structures`, query),
    tierStructuresBatch: (id) => `/v2/loyalties/programs/${id}/tier-structures/batch`,

    // Program reports
    spendingDaily: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/reports/spending/daily`, query),
    spendingSummary: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/reports/spending/summary`, query),
    pointsEarningsDaily: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/reports/points-earnings/daily`, query),
    pointsEarningsSummary: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/reports/points-earnings/summary`, query),
    earningRulesDaily: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/reports/earning-rules/daily`, query),
    earningRulesSummary: (id, query = {}) => withQuery(`/v2/loyalties/programs/${id}/reports/earning-rules/summary`, query)
  },

  // Card Definitions
  cardDefinitions: {
    list: (query = {}) => withQuery('/v2/loyalties/card-definitions', query),
    get: (id) => `/v2/loyalties/card-definitions/${id}`,
    create: () => '/v2/loyalties/card-definitions',
    update: (id) => `/v2/loyalties/card-definitions/${id}`,
    delete: (id) => `/v2/loyalties/card-definitions/${id}`,
    activate: (id) => `/v2/loyalties/card-definitions/${id}/activate`,
    deactivate: (id) => `/v2/loyalties/card-definitions/${id}/deactivate`,
    draft: (id) => `/v2/loyalties/card-definitions/${id}/draft`,
    activities: (id) => `/v2/loyalties/card-definitions/${id}/activities`
  },

  // Earning Rules
  earningRules: {
    list: (query = {}) => withQuery('/v2/loyalties/earning-rules', query),
    get: (id) => `/v2/loyalties/earning-rules/${id}`,
    create: () => '/v2/loyalties/earning-rules',
    update: (id) => `/v2/loyalties/earning-rules/${id}`,
    delete: (id) => `/v2/loyalties/earning-rules/${id}`,
    activate: (id) => `/v2/loyalties/earning-rules/${id}/activate`,
    deactivate: (id) => `/v2/loyalties/earning-rules/${id}/deactivate`,
    draft: (id) => `/v2/loyalties/earning-rules/${id}/draft`,
    activities: (id) => `/v2/loyalties/earning-rules/${id}/activities`
  },

  // Rewards
  rewards: {
    list: (query = {}) => withQuery('/v2/loyalties/rewards', query),
    get: (id) => `/v2/loyalties/rewards/${id}`,
    create: () => '/v2/loyalties/rewards',
    update: (id) => `/v2/loyalties/rewards/${id}`,
    delete: (id) => `/v2/loyalties/rewards/${id}`,
    activate: (id) => `/v2/loyalties/rewards/${id}/activate`,
    deactivate: (id) => `/v2/loyalties/rewards/${id}/deactivate`,
    draft: (id) => `/v2/loyalties/rewards/${id}/draft`,
    activities: (id) => `/v2/loyalties/rewards/${id}/activities`
  },

  // Benefits
  benefits: {
    list: (query = {}) => withQuery('/v2/loyalties/benefits', query),
    get: (id) => `/v2/loyalties/benefits/${id}`,
    create: () => '/v2/loyalties/benefits',
    update: (id) => `/v2/loyalties/benefits/${id}`,
    delete: (id) => `/v2/loyalties/benefits/${id}`,
    activate: (id) => `/v2/loyalties/benefits/${id}/activate`,
    draft: (id) => `/v2/loyalties/benefits/${id}/draft`,
    activities: (id) => `/v2/loyalties/benefits/${id}/activities`
  },

  // Tier Structures
  tierStructures: {
    list: (query = {}) => withQuery('/v2/loyalties/tier-structures', query),
    get: (id) => `/v2/loyalties/tier-structures/${id}`,
    create: () => '/v2/loyalties/tier-structures',
    update: (id) => `/v2/loyalties/tier-structures/${id}`,
    delete: (id) => `/v2/loyalties/tier-structures/${id}`,
    activate: (id) => `/v2/loyalties/tier-structures/${id}/activate`,
    deactivate: (id) => `/v2/loyalties/tier-structures/${id}/deactivate`,
    draft: (id) => `/v2/loyalties/tier-structures/${id}/draft`,
    activities: (id) => `/v2/loyalties/tier-structures/${id}/activities`,

    // Tiers (nested)
    tiers: {
      list: (structureId) => `/v2/loyalties/tier-structures/${structureId}/tiers`,
      create: (structureId) => `/v2/loyalties/tier-structures/${structureId}/tiers`,
      update: (structureId, tierId) => `/v2/loyalties/tier-structures/${structureId}/tiers/${tierId}`,
      delete: (structureId, tierId) => `/v2/loyalties/tier-structures/${structureId}/tiers/${tierId}`
    }
  },

  // Members
  members: {
    list: (programId, query = {}) => withQuery(`/v2/loyalties/programs/${programId}/members`, query),
    create: (programId) => `/v2/loyalties/programs/${programId}/members`,
    activate: (programId, memberId) => `/v2/loyalties/programs/${programId}/members/${memberId}/activate`,
    deactivate: (programId, memberId) => `/v2/loyalties/programs/${programId}/members/${memberId}/deactivate`,
    delete: (programId, memberId) => `/v2/loyalties/programs/${programId}/members/${memberId}`,
    activities: (programId, memberId) => `/v2/loyalties/programs/${programId}/members/${memberId}/activities`,

    // Card operations
    adjustPoints: (programId, memberId, cardId) => `/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/points`,
    cardActivities: (programId, memberId, cardId) => `/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/activities`,
    cardTransactions: (programId, memberId, cardId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/transactions`, query),
    pendingPoints: (programId, memberId, cardId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/pending-points`, query),
    activatePendingPoints: (programId, memberId, cardId, bucketId) => `/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/pending-points/${bucketId}/activate`,
    cancelPendingPoints: (programId, memberId, cardId, bucketId) => `/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/pending-points/${bucketId}/cancel`,
    expiringPoints: (programId, memberId, cardId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/expiring-points`, query),
    expirePoints: (programId, memberId, cardId, bucketId) => `/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/expiring-points/${bucketId}/expire`,

    // Reward operations
    rewardPurchases: (programId, memberId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/rewards/purchases`, query),
    purchaseReward: (programId, memberId) => `/v2/loyalties/programs/${programId}/members/${memberId}/rewards/purchases`,
    refundRewardPurchase: (programId, rewardTxId) => `/v2/loyalties/programs/${programId}/rewards/purchases/${rewardTxId}/refund`,

    // Order payment operations
    orderPayments: (programId, memberId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/orders/payments`, query),
    createOrderPayment: (programId, memberId) => `/v2/loyalties/programs/${programId}/members/${memberId}/orders/payments`,

    // Benefit transactions
    benefitTransactions: (programId, memberId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/benefits/transactions`, query),

    // Tier transactions
    tierTransactions: (programId, memberId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/tiers/transactions`, query),

    // Daily card reports
    dailyReports: (programId, memberId, cardId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/reports/daily`, query)
  },

  // Memberships
  memberships: {
    // All memberships for a customer across programs, in one call.
    // `customerId` is a generic identifier value; its meaning is controlled by
    // `query.identification_type` (customer_id | customer_source_id | member_id).
    list: (customerId, query = {}) => withQuery(`/v2/loyalties/memberships/${customerId}`, query),
    // Single membership scoped to one program. Same identifier convention as `list`.
    get: (programId, customerId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/memberships/${customerId}`, query)
  },

  // Orders (v1 API)
  orders: {
    create: () => '/v1/orders'
  },

  // Events (v1 API)
  events: {
    create: () => '/v1/events'
  },

  // Customers (v1 API)
  customers: {
    update: (customerId) => `/v1/customers/${customerId}`
  },

  examine: {
    run: () => '/v2/loyalties/examine/earning-rules',
    rewards: () => '/v2/loyalties/examine/rewards'
  }
};
