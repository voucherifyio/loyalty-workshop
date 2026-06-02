// Entity property configuration system
// Defines which fields are editable for each entity type and lifecycle state

/**
 * Entity property definitions
 * Each property defines which lifecycle states it can be edited in
 */
export const ENTITY_PROPERTIES = {
  programs: {
    name: {
      label: 'Program Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    status: {
      label: 'Status',
      states: ['DRAFT'],
    },
    validity_hours: {
      label: 'Validity Hours',
      states: ['DRAFT'],
    },
    start_date: {
      label: 'Start Date',
      states: ['DRAFT'],
    },
    end_date: {
      label: 'End Date',
      states: ['DRAFT'],
    },
    metadata: {
      label: 'Metadata',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },

  cardDefinitions: {
    name: {
      label: 'Card Definition Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    code_config: {
      label: 'Code Config',
      states: ['DRAFT'],
    },
    points_expiration: {
      label: 'Points Expiration',
      states: ['DRAFT'],
    },
    pending_points: {
      label: 'Pending Points',
      states: ['DRAFT'],
    },
    earning_limits: {
      label: 'Earning Limits',
      states: ['DRAFT'],
    },
    spending_limits: {
      label: 'Spending Limits',
      states: ['DRAFT'],
    },
    refunds: {
      label: 'Refunds',
      states: ['DRAFT'],
    },
    balance_settings: {
      label: 'Balance Settings',
      states: ['DRAFT'],
    },
    pay_with_points: {
      label: 'Pay With Points',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    metadata: {
      label: 'Metadata',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },

  earningRules: {
    name: {
      label: 'Earning Rule Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    trigger: {
      label: 'Trigger',
      states: ['DRAFT'],
    },
    earnings: {
      label: 'Earnings',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    error: {
      label: 'Error',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    validity_hours: {
      label: 'Validity Hours',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    start_date: {
      label: 'Start Date',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    end_date: {
      label: 'End Date',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    trigger_limits: {
      label: 'Trigger Limits',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    metadata: {
      label: 'Metadata',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },

  incentives: {
    name: {
      label: 'Incentive Name',
      states: ['DRAFT', 'ACTIVE'],
    },
    type: {
      label: 'Type',
      states: ['DRAFT'],
    },
    points: {
      label: 'Points',
      states: ['DRAFT'],
    },
    points_proportional: {
      label: 'Points Proportional',
      states: ['DRAFT'],
    },
    material: {
      label: 'Material',
      states: ['DRAFT'],
    },
    digital: {
      label: 'Digital',
      states: ['DRAFT'],
    },
    stock: {
      label: 'Stock',
      states: ['DRAFT', 'ACTIVE'],
    },
    metadata: {
      label: 'Metadata',
      states: ['DRAFT', 'ACTIVE'],
    },
  },

  rewards: {
    name: {
      label: 'Reward Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    type: {
      label: 'Type',
      states: ['DRAFT'],
    },
    material: {
      label: 'Material',
      states: ['DRAFT'],
    },
    digital: {
      label: 'Digital',
      states: ['DRAFT'],
    },
    refunds: {
      label: 'Refunds',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    validity_hours: {
      label: 'Validity Hours',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    start_date: {
      label: 'Start Date',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    end_date: {
      label: 'End Date',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    costs: {
      label: 'Costs',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    metadata: {
      label: 'Metadata',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },

  tierStructures: {
    name: {
      label: 'Tier Structure Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    type: {
      label: 'Type',
      states: ['DRAFT'],
    },
    point_balance: {
      label: 'Point Balance',
      states: ['DRAFT'],
    },
    point_earned: {
      label: 'Point Earned',
      states: ['DRAFT'],
    },
    expiration: {
      label: 'Expiration',
      states: ['DRAFT'],
    },
    downgrade: {
      label: 'Downgrade',
      states: ['DRAFT'],
    },
    metadata: {
      label: 'Metadata',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },

  tiers: {
    _usesParentStatus: true,
    _parentEntityType: 'tierStructures',
    name: {
      label: 'Tier Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    qualification_rules: {
      label: 'Qualification Rules',
      states: ['DRAFT'],
    },
    downgrade: {
      label: 'Downgrade',
      states: ['DRAFT'],
    },
    metadata: {
      label: 'Metadata',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },
};

/**
 * Get properties for a specific entity type
 */
export function getEntityProperties(entityType) {
  return ENTITY_PROPERTIES[entityType] || {};
}

/**
 * Get editable properties for a specific entity type and state
 */
export function getEditableProperties(entityType, entityState) {
  const properties = getEntityProperties(entityType);
  const editable = {};

  for (const [fieldName, fieldConfig] of Object.entries(properties)) {
    if (fieldConfig.states.includes(entityState)) {
      editable[fieldName] = fieldConfig;
    }
  }

  return editable;
}
