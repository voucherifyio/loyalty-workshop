// Relationship checking functions for entity connections
// These are pure functions that determine visual highlighting based on selections

/**
 * Returns the card_definition_id for a tier structure based on its type.
 * New model: POINT_BALANCE → ts.balance.card_definition_id
 *            POINT_EARNED  → ts.point_earned.card_definition_id
 * Legacy fallback: ts.card_definition_id (top-level, pre-migration records)
 * All other types with no card ref (global / future) → null
 */
export function getTierStructureCardDefId(ts) {
  if (ts.type === 'POINT_BALANCE') return ts.point_balance?.card_definition_id ?? ts.card_definition_id ?? null;
  if (ts.type === 'POINT_EARNED') return ts.point_earned?.card_definition_id ?? ts.card_definition_id ?? null;
  return ts.card_definition_id ?? null;
}

// Maps entity type keys to their ID field names in API response objects
const ID_FIELD_MAP = {
  cardDefinitions: 'card_definition_id',
  earningRules: 'earning_rule_id',
  incentives: 'incentive_id',
  rewards: 'reward_id',
  tierStructures: 'tier_structure_id',
};

// Check if an entity is related to the selected program
export function isEntityRelatedToSelectedProgram(entityType, entityId, selection, programs) {
  if (!selection || selection.type !== 'program') return false;
  const program = programs.find((p) => p.id === selection.id);
  const idField = ID_FIELD_MAP[entityType];
  return program?.assignedEntities?.[entityType]?.some(
    (e) => (e[idField] || e.id) === entityId,
  );
}

// Check if a program is related to the selected entity
export function isProgramRelatedToSelectedEntity(programId, selection, programs) {
  if (!selection || selection.type !== 'entity') return false;
  const program = programs.find((p) => p.id === programId);
  const idField = ID_FIELD_MAP[selection.category];
  return program?.assignedEntities?.[selection.category]?.some(
    (e) => (e[idField] || e.id) === selection.id,
  );
}

// Incentive-specific relationship checking
export function isEarningRuleRelatedToSelectedIncentive(earningRuleId, selection, earningRuleIncentives) {
  if (
    !selection ||
    selection.type !== 'entity' ||
    selection.category !== 'incentives'
  )
    return false;
  return earningRuleIncentives[earningRuleId]?.some(
    (inc) => (inc.incentive_id || inc.id) === selection.id,
  );
}

export function isIncentiveRelatedToSelectedEarningRule(incentiveId, selection, earningRuleIncentives) {
  if (
    !selection ||
    selection.type !== 'entity' ||
    selection.category !== 'earningRules'
  )
    return false;
  return earningRuleIncentives[selection.id]?.some(
    (inc) => (inc.incentive_id || inc.id) === incentiveId,
  );
}

// Check if an earning rule uses the selected card definition
export function isEarningRuleRelatedToSelectedCardDefinition(earningRuleId, selection, earningRuleCards) {
  if (
    !selection ||
    selection.type !== 'entity' ||
    selection.category !== 'cardDefinitions'
  )
    return false;
  return earningRuleCards[earningRuleId]?.includes(selection.id);
}

// Check if a tier structure uses the selected card definition
export function isTierStructureRelatedToSelectedCardDefinition(tierStructureId, selection, tierStructureCards) {
  if (
    !selection ||
    selection.type !== 'entity' ||
    selection.category !== 'cardDefinitions'
  )
    return false;
  return tierStructureCards[tierStructureId] === selection.id;
}

// Check if a card definition is used by the selected earning rule
export function isCardDefinitionRelatedToSelectedEarningRule(cardDefinitionId, selection, earningRuleCards) {
  if (
    !selection ||
    selection.type !== 'entity' ||
    selection.category !== 'earningRules'
  )
    return false;
  return earningRuleCards[selection.id]?.includes(cardDefinitionId);
}

// Check if a card definition is used by the selected tier structure
export function isCardDefinitionRelatedToSelectedTierStructure(cardDefinitionId, selection, tierStructureCards) {
  if (
    !selection ||
    selection.type !== 'entity' ||
    selection.category !== 'tierStructures'
  )
    return false;
  return tierStructureCards[selection.id] === cardDefinitionId;
}
