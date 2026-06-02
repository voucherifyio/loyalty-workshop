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

    // Program assignments
    cardDefinitions: (id) => `/v2/loyalties/programs/${id}/card-definitions`,
    cardDefinitionsBatch: (id) => `/v2/loyalties/programs/${id}/card-definitions/batch`,
    earningRules: (id) => `/v2/loyalties/programs/${id}/earning-rules`,
    earningRulesBatch: (id) => `/v2/loyalties/programs/${id}/earning-rules/batch`,
    rewards: (id) => `/v2/loyalties/programs/${id}/rewards`,
    rewardsBatch: (id) => `/v2/loyalties/programs/${id}/rewards/batch`,
    tierStructures: (id) => `/v2/loyalties/programs/${id}/tier-structures`,
    tierStructuresBatch: (id) => `/v2/loyalties/programs/${id}/tier-structures/batch`
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

  // Incentives
  incentives: {
    list: (query = {}) => withQuery('/v2/loyalties/incentives', query),
    get: (id) => `/v2/loyalties/incentives/${id}`,
    create: () => '/v2/loyalties/incentives',
    update: (id) => `/v2/loyalties/incentives/${id}`,
    delete: (id) => `/v2/loyalties/incentives/${id}`,
    activate: (id) => `/v2/loyalties/incentives/${id}/activate`,
    draft: (id) => `/v2/loyalties/incentives/${id}/draft`,
    activities: (id) => `/v2/loyalties/incentives/${id}/activities`
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
    get: (programId, memberId) => `/v2/loyalties/programs/${programId}/members/${memberId}`,
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

    // Incentive transactions
    incentiveTransactions: (programId, memberId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/incentives/transactions`, query),

    // Daily card reports
    dailyReports: (programId, memberId, cardId, query = {}) =>
      withQuery(`/v2/loyalties/programs/${programId}/members/${memberId}/cards/${cardId}/reports/daily`, query)
  },

  // Orders (v1 API)
  orders: {
    create: () => '/v1/orders'
  },

  // Events (v1 API)
  events: {
    create: () => '/v1/events'
  },

  examine: {
    run: () => '/v2/loyalties/examine/earning-rules'
  }
};
