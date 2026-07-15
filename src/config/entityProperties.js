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
      type: 'datetime',
      states: ['DRAFT'],
    },
    end_date: {
      label: 'End Date',
      type: 'datetime',
      // Can be edited on live programs too — no need to deactivate first.
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    metadata: {
      label: 'Metadata',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },

  cardDefinitions: {
    name: {
      label: 'Card Definition Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    status: {
      label: 'Status',
      states: ['DRAFT'],
    },
    type: {
      label: 'Type',
      states: ['DRAFT'],
    },
    code_config: {
      label: 'Code Config',
      type: 'json',
      states: ['DRAFT'],
    },
    points_expiration: {
      label: 'Points Expiration',
      type: 'json',
      states: ['DRAFT'],
    },
    pending_points: {
      label: 'Pending Points',
      type: 'json',
      states: ['DRAFT'],
    },
    earning_limits: {
      label: 'Earning Limits',
      type: 'json',
      states: ['DRAFT'],
    },
    spending_limits: {
      label: 'Spending Limits',
      type: 'json',
      states: ['DRAFT'],
    },
    refunds: {
      label: 'Refunds',
      type: 'json',
      states: ['DRAFT'],
    },
    balance_settings: {
      label: 'Balance Settings',
      type: 'json',
      states: ['DRAFT'],
    },
    pay_with_points: {
      label: 'Pay With Points',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    metadata: {
      label: 'Metadata',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },

  earningRules: {
    name: {
      label: 'Earning Rule Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    status: {
      label: 'Status',
      states: ['DRAFT'],
    },
    trigger: {
      label: 'Trigger',
      type: 'json',
      states: ['DRAFT'],
    },
    earnings: {
      label: 'Earnings',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    error: {
      label: 'Error',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    validity_hours: {
      label: 'Validity Hours',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    start_date: {
      label: 'Start Date',
      type: 'datetime',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    end_date: {
      label: 'End Date',
      type: 'datetime',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    trigger_limits: {
      label: 'Trigger Limits',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    metadata: {
      label: 'Metadata',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },

  benefits: {
    name: {
      label: 'Benefit Name',
      states: ['DRAFT', 'ACTIVE'],
    },
    status: {
      label: 'Status',
      states: ['DRAFT'],
    },
    type: {
      label: 'Type',
      states: ['DRAFT'],
    },
    points: {
      label: 'Points',
      type: 'json',
      states: ['DRAFT'],
    },
    points_proportional: {
      label: 'Points Proportional',
      type: 'json',
      states: ['DRAFT'],
    },
    material: {
      label: 'Material',
      type: 'json',
      states: ['DRAFT'],
    },
    digital: {
      label: 'Digital',
      type: 'json',
      states: ['DRAFT'],
    },
    stock: {
      label: 'Stock',
      states: ['DRAFT', 'ACTIVE'],
    },
    metadata: {
      label: 'Metadata',
      type: 'json',
      states: ['DRAFT', 'ACTIVE'],
    },
  },

  rewards: {
    name: {
      label: 'Reward Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    status: {
      label: 'Status',
      states: ['DRAFT'],
    },
    type: {
      label: 'Type',
      states: ['DRAFT'],
    },
    material: {
      label: 'Material',
      type: 'json',
      states: ['DRAFT'],
    },
    digital: {
      label: 'Digital',
      type: 'json',
      states: ['DRAFT'],
    },
    refunds: {
      label: 'Refunds',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    validity_hours: {
      label: 'Validity Hours',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    start_date: {
      label: 'Start Date',
      type: 'datetime',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    end_date: {
      label: 'End Date',
      type: 'datetime',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    costs: {
      label: 'Costs',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    metadata: {
      label: 'Metadata',
      type: 'json',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
  },

  tierStructures: {
    name: {
      label: 'Tier Structure Name',
      states: ['DRAFT', 'ACTIVE', 'INACTIVE'],
    },
    status: {
      label: 'Status',
      states: ['DRAFT'],
    },
    type: {
      label: 'Type',
      states: ['DRAFT'],
    },
    point_balance: {
      label: 'Point Balance',
      type: 'json',
      states: ['DRAFT'],
    },
    point_earned: {
      label: 'Point Earned',
      type: 'json',
      states: ['DRAFT'],
    },
    expiration: {
      label: 'Expiration',
      type: 'json',
      states: ['DRAFT'],
    },
    downgrade: {
      label: 'Downgrade',
      type: 'json',
      states: ['DRAFT'],
    },
    metadata: {
      label: 'Metadata',
      type: 'json',
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
      type: 'json',
      states: ['DRAFT'],
    },
    downgrade: {
      label: 'Downgrade',
      type: 'json',
      states: ['DRAFT'],
    },
    points_expiration: {
      label: 'Points Expiration',
      type: 'json',
      states: ['DRAFT'],
    },
    metadata: {
      label: 'Metadata',
      type: 'json',
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
    // Skip metadata fields (fields starting with _)
    if (fieldName.startsWith('_')) continue;
    
    if (fieldConfig.states.includes(entityState)) {
      editable[fieldName] = fieldConfig;
    }
  }

  return editable;
}
