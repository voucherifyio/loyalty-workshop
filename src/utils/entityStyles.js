// CSS class helper functions for visual styling
// These functions compute Tailwind CSS classes based on selection state and relationships

import {
  isProgramRelatedToSelectedEntity,
  isEntityRelatedToSelectedProgram,
  isEarningRuleRelatedToSelectedBenefit,
  isBenefitRelatedToSelectedEarningRule,
  isEarningRuleRelatedToSelectedCardDefinition,
  isTierStructureRelatedToSelectedCardDefinition,
  isCardDefinitionRelatedToSelectedEarningRule,
  isCardDefinitionRelatedToSelectedTierStructure
} from './entityRelationships.js';

// Color scheme:
// - Assignment mode (program selected): primary color (blue)
// - Relationship mode (entity selected): secondary color (different from assignment)
const HIGHLIGHTED_ASSIGNMENT   = "bg-primary/10 border border-primary/30";
const HIGHLIGHTED_RELATIONSHIP = "bg-secondary/10 border border-secondary/30";
const SELECTED_PROGRAM         = HIGHLIGHTED_ASSIGNMENT;
const SELECTED_ENTITY          = HIGHLIGHTED_RELATIONSHIP;
const DIMMED                   = "opacity-30";

export function getProgramClasses(
  program,
  selection,
  removingCard,
  shakeCard,
  earningRuleBenefits,
  programs
) {
  let classes = "";

  // Add fade-out animation if being removed
  if (removingCard?.type === "programs" && removingCard?.id === program.id) {
    classes += "animate-fadeout ";
  }

  // Add shake animation if error occurred
  if (shakeCard?.type === "programs" && shakeCard?.id === program.id) {
    classes += "animate-shake ";
  }

  if (!selection || !selection.type) return classes;

  // Selected program itself (assignment mode)
  if (selection.type === "program" && selection.id === program.id) {
    return classes + SELECTED_PROGRAM;
  }

  // Other program selected → dim non-selected programs
  if (selection.type === "program") {
    return classes + DIMMED;
  }

  // Entity selected: check if this program is related to the selected entity
  if (selection.type === "entity") {
    if (selection.category === "benefits") {
      // Benefits relate to programs via earning rules
      const relatedRuleIds = Object.keys(earningRuleBenefits).filter(
        (ruleId) => earningRuleBenefits[ruleId]?.some(
          (benefit) => (benefit.benefit_id || benefit.id) === selection.id
        )
      );
      if (relatedRuleIds.length === 0) return classes + DIMMED;
      const programRuleIds = new Set(
        (program?.assignedEntities?.earningRules || []).map((e) => e.earning_rule_id || e.id)
      );
      return relatedRuleIds.some((id) => programRuleIds.has(id))
        ? classes + HIGHLIGHTED_RELATIONSHIP
        : classes + DIMMED;
    }

    return isProgramRelatedToSelectedEntity(program.id, selection, programs)
      ? classes + HIGHLIGHTED_RELATIONSHIP
      : classes + DIMMED;
  }

  return classes;
}

export function getEntityClasses(
  entityType,
  entity,
  selection,
  removingCard,
  shakeCard,
  earningRuleCards,
  tierStructureCards,
  earningRuleBenefits,
  benefitCards,
  programs
) {
  let classes = "";

  // Add fade-out animation if being removed
  if (removingCard?.type === entityType && removingCard?.id === entity.id) {
    classes += "animate-fadeout ";
  }

  // Add shake animation if error occurred
  if (shakeCard?.type === entityType && shakeCard?.id === entity.id) {
    classes += "animate-shake ";
  }

  if (!selection || !selection.type) return classes;

  // Highlight the selected entity itself (relationship mode)
  if (
    selection.type === "entity" &&
    selection.category === entityType &&
    selection.id === entity.id
  ) {
    return classes + SELECTED_ENTITY;
  }

  // ── Entity-to-entity relationships ──────────────────────────────────────
  if (selection.type === "entity") {
    const sel = selection.category;

    // Types that have NO relationship with each other → dim immediately
    const relationships = {
      cardDefinitions: ["earningRules", "tierStructures", "benefits"],
      earningRules:    ["benefits", "cardDefinitions"],
      benefits:      ["earningRules", "cardDefinitions"],
      rewards:         [],
      tierStructures:  ["cardDefinitions"],
    };
    const hasRelationship =
      relationships[sel]?.includes(entityType) ||
      relationships[entityType]?.includes(sel);
    if (!hasRelationship) return classes + DIMMED;

    // ── Card Definition selected ─────────────────────────────────────────
    if (sel === "cardDefinitions") {
      if (entityType === "earningRules") {
        return isEarningRuleRelatedToSelectedCardDefinition(entity.id, selection, earningRuleCards)
          ? classes + HIGHLIGHTED_RELATIONSHIP
          : classes + DIMMED;
      }
      if (entityType === "tierStructures") {
        return isTierStructureRelatedToSelectedCardDefinition(entity.id, selection, tierStructureCards)
          ? classes + HIGHLIGHTED_RELATIONSHIP
          : classes + DIMMED;
      }
      if (entityType === "benefits") {
        // Direct: benefit.points.card_definition_id
        if (benefitCards[entity.id] === selection.id) return classes + HIGHLIGHTED_RELATIONSHIP;
        // 2-hop via earning rules: earning rule uses both the card def and this benefit
        const relatedRuleIds = Object.keys(earningRuleCards).filter(
          (ruleId) => earningRuleCards[ruleId]?.includes(selection.id)
        );
        const indirectMatch = relatedRuleIds.some(
          (ruleId) => earningRuleBenefits[ruleId]?.some(
            (benefit) => (benefit.benefit_id || benefit.id) === entity.id
          )
        );
        return indirectMatch ? classes + HIGHLIGHTED_RELATIONSHIP : classes + DIMMED;
      }
    }

    // ── Earning Rule selected ────────────────────────────────────────────
    if (sel === "earningRules") {
      if (entityType === "benefits") {
        return isBenefitRelatedToSelectedEarningRule(entity.id, selection, earningRuleBenefits)
          ? classes + HIGHLIGHTED_RELATIONSHIP
          : classes + DIMMED;
      }
      if (entityType === "cardDefinitions") {
        // Direct: earning rule has a POINTS effect referencing this card def
        if (isCardDefinitionRelatedToSelectedEarningRule(entity.id, selection, earningRuleCards)) {
          return classes + HIGHLIGHTED_RELATIONSHIP;
        }
        // Indirect: earning rule → benefit → benefit's card_definition_id
        const linkedBenefits = earningRuleBenefits[selection.id] || [];
        const viaBenefit = linkedBenefits.some(
          (benefit) => benefitCards[benefit.benefit_id || benefit.id] === entity.id
        );
        return viaBenefit ? classes + HIGHLIGHTED_RELATIONSHIP : classes + DIMMED;
      }
    }

    // ── Benefit selected ───────────────────────────────────────────────
    if (sel === "benefits") {
      if (entityType === "earningRules") {
        return isEarningRuleRelatedToSelectedBenefit(entity.id, selection, earningRuleBenefits)
          ? classes + HIGHLIGHTED_RELATIONSHIP
          : classes + DIMMED;
      }
      if (entityType === "cardDefinitions") {
        // Direct: this card def is the one the benefit awards points to
        if (benefitCards[selection.id] === entity.id) return classes + HIGHLIGHTED_RELATIONSHIP;
        // 2-hop: earning rule links this benefit AND this card def
        const relatedRuleIds = Object.keys(earningRuleBenefits).filter(
          (ruleId) => earningRuleBenefits[ruleId]?.some(
            (benefit) => (benefit.benefit_id || benefit.id) === selection.id
          )
        );
        const indirectMatch = relatedRuleIds.some(
          (ruleId) => earningRuleCards[ruleId]?.includes(entity.id)
        );
        return indirectMatch ? classes + HIGHLIGHTED_RELATIONSHIP : classes + DIMMED;
      }
    }

    // ── Tier Structure selected ──────────────────────────────────────────
    if (sel === "tierStructures") {
      if (entityType === "cardDefinitions") {
        return isCardDefinitionRelatedToSelectedTierStructure(entity.id, selection, tierStructureCards)
          ? classes + HIGHLIGHTED_RELATIONSHIP
          : classes + DIMMED;
      }
    }

    return classes;
  }

  // ── Program-to-entity relationships (assignment mode) ───────────────────
  if (selection.type === "program") {
    if (entityType === "benefits") {
      // Benefits relate to programs indirectly via earning rules
      const relatedRuleIds = Object.keys(earningRuleBenefits).filter(
        (ruleId) => earningRuleBenefits[ruleId]?.some(
          (benefit) => (benefit.benefit_id || benefit.id) === entity.id
        )
      );
      if (relatedRuleIds.length === 0) return classes + DIMMED;
      const program = programs.find((p) => p.id === selection.id);
      const programRuleIds = new Set(
        (program?.assignedEntities?.earningRules || []).map((e) => e.earning_rule_id || e.id)
      );
      return relatedRuleIds.some((id) => programRuleIds.has(id))
        ? classes + HIGHLIGHTED_ASSIGNMENT
        : classes + DIMMED;
    }

    return isEntityRelatedToSelectedProgram(entityType, entity.id, selection, programs)
      ? classes + HIGHLIGHTED_ASSIGNMENT
      : classes + DIMMED;
  }

  return classes;
}
