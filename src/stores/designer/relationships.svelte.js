/**
 * Relationships store — entity usage counts and cross-entity links.
 *
 * Holds computed maps (entityUsage, earningRuleIncentives, etc.) and
 * exposes helper functions. Consumers call refreshAll() after data loads.
 */
import { api } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { getTierStructureCardDefId } from '../../utils/entityRelationships.js';

class RelationshipsStore {
  entityUsage = $state({
    cardDefinitions: {},
    earningRules: {},
    incentives: {},
    rewards: {},
    tierStructures: {},
  });

  earningRuleIncentives = $state({});
  earningRuleCards = $state({}); // earningRuleId → cardDefinitionId[]
  tierStructureCards = $state({}); // tierStructureId → cardDefinitionId
  incentiveCards = $state({}); // incentiveId → cardDefinitionId (direct, from incentive.points.card_definition_id)
  cardDefinitionUsage = $state({
    earningRules: {},    // cardDefId → count of earning rules using it
    tierStructures: {},  // cardDefId → count of tier structures using it
  });

  /** Recalculate all relationship maps from current programs + entities. */
  async refreshAll(programs, entities) {
    this.entityUsage = this.calculateEntityUsage(programs);

    const { incentiveMap, incentiveUsage } = await this.fetchIncentivesForEarningRules(
      entities.earningRules
    );
    this.earningRuleIncentives = incentiveMap;
    this.entityUsage.incentives = incentiveUsage;

    const { erCards, tsCards, cardUsage } = this.extractCardDefinitionRelationships(
      entities.earningRules,
      entities.tierStructures
    );
    this.earningRuleCards = erCards;
    this.tierStructureCards = tsCards;
    this.cardDefinitionUsage = cardUsage;

    this.incentiveCards = this.buildIncentiveCardsMap(entities.incentives);
  }

  /** Recompute entity usage from program assignment data. */
  refreshUsage(programs) {
    this.entityUsage = this.calculateEntityUsage(programs);
  }

  /** Recompute card-definition relationship maps. */
  refreshCardRelationships(earningRules, tierStructures) {
    const { erCards, tsCards, cardUsage } = this.extractCardDefinitionRelationships(
      earningRules, tierStructures
    );
    this.earningRuleCards = erCards;
    this.tierStructureCards = tsCards;
    this.cardDefinitionUsage = cardUsage;
  }

  /** Recompute incentive → card definition direct map from incentive list. */
  refreshIncentiveCards(incentives) {
    this.incentiveCards = this.buildIncentiveCardsMap(incentives);
  }

  /** Remove an earning rule from the incentive map and recalculate incentive usage. */
  removeEarningRule(id) {
    const { [id]: _removed, ...rest } = this.earningRuleIncentives;
    this.earningRuleIncentives = rest;

    const allIncentives = Object.values(this.earningRuleIncentives).flat();
    const incentiveUsage = {};
    allIncentives.forEach((inc) => {
      const incId = inc.incentive_id || inc.id;
      incentiveUsage[incId] = (incentiveUsage[incId] || 0) + 1;
    });
    this.entityUsage = { ...this.entityUsage, incentives: incentiveUsage };
  }

  // ── Pure computation helpers ──────────────────────────────────────────────

  /** Build incentiveId → cardDefinitionId map from incentive objects directly. */
  buildIncentiveCardsMap(incentives) {
    const map = {};
    incentives.forEach((inc) => {
      const cardDefId =
        inc.points?.card_definition_id ??
        inc.points_proportional?.card_definition_id ??
        null;
      if (cardDefId) map[inc.id] = cardDefId;
    });
    return map;
  }

  calculateEntityUsage(programsWithAssignments) {
    const usage = {
      cardDefinitions: {},
      earningRules: {},
      incentives: {},
      rewards: {},
      tierStructures: {},
    };

    programsWithAssignments.forEach((program) => {
      if (!program.assignedEntities) return;

      program.assignedEntities.cardDefinitions?.forEach((e) => {
        const id = e.card_definition_id || e.id;
        usage.cardDefinitions[id] = (usage.cardDefinitions[id] || 0) + 1;
      });
      program.assignedEntities.earningRules?.forEach((e) => {
        const id = e.earning_rule_id || e.id;
        usage.earningRules[id] = (usage.earningRules[id] || 0) + 1;
      });
      program.assignedEntities.rewards?.forEach((e) => {
        const id = e.reward_id || e.id;
        usage.rewards[id] = (usage.rewards[id] || 0) + 1;
      });
      program.assignedEntities.tierStructures?.forEach((e) => {
        const id = e.tier_structure_id || e.id;
        usage.tierStructures[id] = (usage.tierStructures[id] || 0) + 1;
      });
    });

    return usage;
  }

  async fetchIncentivesForEarningRules(earningRules) {
    const incentiveMap = {};
    const incentiveUsage = {};

    earningRules.forEach((earningRule) => {
      const incentivesInRule = [];

      if (earningRule.earnings && Array.isArray(earningRule.earnings)) {
        earningRule.earnings.forEach((earning) => {
          if (earning.effects && Array.isArray(earning.effects)) {
            earning.effects.forEach((effect) => {
              if (effect.type === 'INCENTIVE' && effect.incentive?.id) {
                incentivesInRule.push({
                  incentive_id: effect.incentive.id,
                  id: effect.incentive.id,
                });
                incentiveUsage[effect.incentive.id] =
                  (incentiveUsage[effect.incentive.id] || 0) + 1;
              }
            });
          }
        });
      }

      if (incentivesInRule.length > 0) {
        incentiveMap[earningRule.id] = incentivesInRule;
      }
    });

    return { incentiveMap, incentiveUsage };
  }

  extractCardDefinitionRelationships(earningRules, tierStructures) {
    const erCards = {};
    const tsCards = {};
    const cardUsage = { earningRules: {}, tierStructures: {} };

    earningRules.forEach((rule) => {
      const cardIds = new Set(); // eslint-disable-line svelte/prefer-svelte-reactivity
      if (rule.earnings) {
        rule.earnings.forEach((earning) => {
          if (earning.effects) {
            earning.effects.forEach((effect) => {
              if (effect.type === 'POINTS' && effect.points?.card_definition_id) {
                cardIds.add(effect.points.card_definition_id);
              }
            });
          }
        });
      }
      if (cardIds.size > 0) {
        erCards[rule.id] = Array.from(cardIds);
        cardIds.forEach((cardId) => {
          cardUsage.earningRules[cardId] = (cardUsage.earningRules[cardId] || 0) + 1;
        });
      }
    });

    tierStructures.forEach((ts) => {
      const cardId = getTierStructureCardDefId(ts);
      if (cardId) {
        tsCards[ts.id] = cardId;
        cardUsage.tierStructures[cardId] = (cardUsage.tierStructures[cardId] || 0) + 1;
      }
    });

    return { erCards, tsCards, cardUsage };
  }

  // ── Program assignment fetcher ─────────────────────────────────────────────

  async fetchProgramAssignments(program) {
    try {
      const [cardDefs, earningRules, rewards, tierStructs, membersRes] = await Promise.all([
        api.get(endpoints.programs.cardDefinitions(program.id)).catch(() => ({ data: [] })),
        api.get(endpoints.programs.earningRules(program.id)).catch(() => ({ data: [] })),
        api.get(endpoints.programs.rewards(program.id)).catch(() => ({ data: [] })),
        api.get(endpoints.programs.tierStructures(program.id)).catch(() => ({ data: [] })),
        api.get(endpoints.members.list(program.id, { limit: 1 })).catch(() => ({ data: [], cursor: null })),
      ]);

      const membersCount = membersRes.data?.length > 0
        ? (membersRes.cursor ? '1+' : membersRes.data.length)
        : 0;

      return {
        ...program,
        assignments: {
          cardDefinitions: cardDefs.data?.length || 0,
          earningRules: earningRules.data?.length || 0,
          rewards: rewards.data?.length || 0,
          tierStructures: tierStructs.data?.length || 0,
        },
        assignedEntities: {
          cardDefinitions: cardDefs.data || [],
          earningRules: earningRules.data || [],
          rewards: rewards.data || [],
          tierStructures: tierStructs.data || [],
        },
        membersCount,
      };
    } catch {
      return {
        ...program,
        assignments: { cardDefinitions: 0, earningRules: 0, rewards: 0, tierStructures: 0 },
        membersCount: 0,
      };
    }
  }
}

export const relationshipsStore = new RelationshipsStore();
