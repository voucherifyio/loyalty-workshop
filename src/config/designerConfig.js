import { earningRuleHasQualificationRules } from '../utils/earningRuleSummary.js';
import { icons } from '../icons/index.js';

// Entity type configuration - grouped by semantic sections
const _structureEntities = [
  { key: "cardDefinitions", name: "Wallets" },
];

const earningsEntities = [
  { key: "earningRules", name: "Earning Rules" },
  { key: "incentives", name: "Incentives" },
];

const rewardsEntities = [
  { key: "rewards", name: "Rewards" },
];

// Combined list for utility functions that need all entity types (keep tierStructures for API loading)
export const entityTypes = [
  { key: "cardDefinitions", name: "Wallets" },
  { key: "tierStructures", name: "Tier Structures" },
  ...earningsEntities,
  ...rewardsEntities,
];

// Icon configuration for entity types
export const entityIcons = {
  cardDefinitions: { name: "Card Definitions", icon: icons.cardDefinitions },
  earningRules:    { name: "Earning Rules",    icon: icons.earningRules },
  incentives:      { name: "Incentives",       icon: icons.incentives },
  rewards:         { name: "Rewards",          icon: icons.rewards },
  tierStructures:  { name: "Tier Structures",  icon: icons.tierStructures },
};

// Sample payloads for entity creation
export const samplePayloads = {
  programs: {
    name: "My Loyalty Program",
    metadata: {},
  },
  cardDefinitions: {
    name: "Basic Card",
    type: "INDIVIDUAL",
    code_config: {
      pattern: "CARD-#######",
    },
  },
  earningRules: {
    name: "Order Paid Points",
    trigger: {
      event: "customer.order.paid",
    },
    earnings: [
      {
        rules: {},
        effects: [
          {
            type: "POINTS",
            points: {
              value: 100,
            },
          },
        ],
      },
    ],
  },
  incentives: {
    name: "Bonus Points Incentive",
    type: "POINTS",
    stock: 0,
    points: {
      value: 50,
    },
  },
  rewards: {
    name: "10% Discount Reward",
    type: "DIGITAL",
    digital: {
      type: "DISCOUNT_COUPONS",
      discount_coupons: {
        campaign_id: "camp_xxx",
      },
    },
  },
  tierStructures: {
    name: "VIP Tier Structure",
    type: "POINT_BALANCE",
    point_balance: { card_definition_id: "cd_xxx" },
  },
  tiers: {
    name: "Gold",
    qualification_rules: {
      type: "POINTS",
      points: { min_value: 1000, max_value: 2999 }
    }
  },
};

// Entity labels for display
export const entityLabels = {
  programs: "Program",
  cardDefinitions: "Card Definition",
  earningRules: "Earning Rule",
  incentives: "Incentive",
  rewards: "Reward",
  tierStructures: "Tier Structure",
  tiers: "Tier",
};

// Assignment limits
export const assignmentLimits = {
  cardDefinitions: 10,
  earningRules: 100,
  rewards: 100,
  tierStructures: 1,
};

// Feature checks for entity cards — each entry defines a detectable "feature"
// check(item) returns true when the feature is actively configured (non-default)
export const featureChecks = {
  cardDefinitions: [
    {
      key: 'expiration',
      label: 'Points Expiration',
      icon: icons.clock,
      check: (item) => item.points_expiration?.type != null && item.points_expiration.type !== 'NO_EXPIRATION',
    },
    {
      key: 'pending',
      label: 'Pending Points',
      icon: icons.exclamationCircle,
      check: (item) => item.pending_points?.type != null && item.pending_points.type !== 'IMMEDIATE',
    },
    {
      key: 'earningLimits',
      label: 'Earning Limits',
      icon: icons.arrowUp,
      check: (item) => item.earning_limits?.global?.type === 'LIMITED' || item.earning_limits?.transactions?.type === 'LIMITED',
    },
    {
      key: 'spendingLimits',
      label: 'Spending Limits',
      icon: icons.arrowDown,
      check: (item) => item.spending_limits?.global?.type === 'LIMITED' || item.spending_limits?.transactions?.type === 'LIMITED',
    },
    {
      key: 'refunds',
      label: 'Refunds',
      icon: icons.arrowUturnLeft,
      check: (item) => item.refunds?.spent_points?.type === 'REFUNDABLE' || item.refunds?.earned_points?.type === 'REFUNDABLE',
    },
    {
      key: 'negativeBalance',
      label: 'Negative Balance',
      icon: icons.minusCircle,
      check: (item) => item.balance_settings?.allow_negative === true,
    },
    {
      key: 'payWithPoints',
      label: 'Pay with Points',
      icon: icons.currencyDollar,
      check: (item) => item.pay_with_points?.type != null && item.pay_with_points.type !== 'NO_PAYMENTS',
    },
    {
      key: 'metadata',
      label: 'Metadata',
      icon: icons.tag,
      check: (item) => Object.keys(item.metadata || {}).length > 0,
    },
  ],

  earningRules: [
    {
      key: 'dateRange',
      label: 'Date Range',
      icon: icons.calendar,
      check: (item) => item.start_date != null || item.end_date != null,
    },
    {
      key: 'validityHours',
      label: 'Validity Hours',
      icon: icons.clock,
      check: (item) => item.validity_hours?.type != null && item.validity_hours.type !== 'ANY_TIME',
    },
    {
      key: 'cooldown',
      label: 'Cooldown',
      icon: icons.hand,
      check: (item) => item.trigger_limits?.cooldown?.type != null && item.trigger_limits.cooldown.type !== 'NO_COOLDOWN',
    },
    {
      key: 'frequency',
      label: 'Frequency Limit',
      icon: icons.chartBar,
      check: (item) => item.trigger_limits?.frequency?.type != null && item.trigger_limits.frequency.type !== 'NO_LIMIT',
    },
    {
      key: 'qualification',
      label: 'Qualification Rules',
      icon: icons.funnel,
      // rules is a VLEarningRuleGroup — keys are numeric strings ("1","2",...) plus a "logic" key.
      // Active only when there are actual rule definition keys (not just "logic" or empty).
      check: (item) => earningRuleHasQualificationRules(item),
    },
    {
      key: 'metadata',
      label: 'Metadata',
      icon: icons.tag,
      check: (item) => Object.keys(item.metadata || {}).length > 0,
    },
  ],

  rewards: [
    {
      key: 'dateRange',
      label: 'Date Range',
      icon: icons.calendar,
      check: (item) => item.start_date != null || item.end_date != null,
    },
    {
      key: 'validityHours',
      label: 'Validity Hours',
      icon: icons.clock,
      check: (item) => item.validity_hours?.type != null && item.validity_hours.type !== 'ANY_TIME',
    },
    {
      key: 'refundable',
      label: 'Refundable',
      icon: icons.arrowUturnLeft,
      check: (item) => item.refunds?.type === 'REFUNDABLE',
    },
    {
      key: 'metadata',
      label: 'Metadata',
      icon: icons.tag,
      check: (item) => Object.keys(item.metadata || {}).length > 0,
    },
  ],

  tierStructures: [
    {
      key: 'expiration',
      label: 'Tier Expiration',
      icon: icons.clock,
      check: (item) => item.expiration?.type != null && item.expiration.type !== 'NO_EXPIRATION',
    },
    {
      key: 'downgrade',
      label: 'Tier Downgrade',
      icon: icons.trendingDown,
      check: (item) => item.downgrade?.type != null && item.downgrade.type !== 'NO_DOWNGRADE',
    },
    {
      key: 'metadata',
      label: 'Metadata',
      icon: icons.tag,
      check: (item) => Object.keys(item.metadata || {}).length > 0,
    },
  ],

  programs: [
    {
      key: 'dateRange',
      label: 'Date Range',
      icon: icons.calendar,
      check: (item) => item.start_date != null || item.end_date != null,
    },
    {
      key: 'validityHours',
      label: 'Validity Hours',
      icon: icons.clock,
      check: (item) => item.validity_hours?.type != null && item.validity_hours.type !== 'ANY_TIME',
    },
    {
      key: 'metadata',
      label: 'Metadata',
      icon: icons.tag,
      check: (item) => Object.keys(item.metadata || {}).length > 0,
    },
  ],
};

// Batch endpoint mapping
export const batchEndpointMap = {
  cardDefinitions: "cardDefinitionsBatch",
  earningRules: "earningRulesBatch",
  rewards: "rewardsBatch",
  tierStructures: "tierStructuresBatch",
};
