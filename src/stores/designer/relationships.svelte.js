/**
 * Relationships store — entity usage counts and cross-entity links.
 *
 * Holds computed maps (entityUsage, earningRuleBenefits, etc.) and
 * exposes helper functions. Consumers call refreshAll() after data loads.
 */
import { api } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { getTierStructureCardDefId } from '../../utils/entityRelationships.js';

class RelationshipsStore {
  entityUsage = $state({
    cardDefinitions: {},
    earningRules: {},
    benefits: {},
    rewards: {},
    tierStructures: {},
  });

  /**
   * True when any program's assignments were fetched as first-page-only and
   * more pages exist. Cleared once loadEverything() re-fetches everything in
   * full. Combined with paginationStore.hasIncompleteData to drive the
   * "Load Everything" highlight.
   */
  hasIncompleteAssignments = $state(false);

  earningRuleBenefits = $state({});
  earningRuleCards = $state({}); // earningRuleId → cardDefinitionId[]
  tierStructureCards = $state({}); // tierStructureId → cardDefinitionId
  benefitCards = $state({}); // benefitId → cardDefinitionId (direct, from benefit.points.card_definition_id)
  cardDefinitionUsage = $state({
    earningRules: {},    // cardDefId → count of earning rules using it
    tierStructures: {},  // cardDefId → count of tier structures using it
  });

  /** Recalculate all relationship maps from current programs + entities. */
  async refreshAll(programs, entities) {
    this.entityUsage = this.calculateEntityUsage(programs);

    const { benefitMap, benefitUsage } = await this.fetchBenefitsForEarningRules(
      entities.earningRules
    );
    this.earningRuleBenefits = benefitMap;
    this.entityUsage.benefits = benefitUsage;

    const { erCards, tsCards, cardUsage } = this.extractCardDefinitionRelationships(
      entities.earningRules,
      entities.tierStructures
    );
    this.earningRuleCards = erCards;
    this.tierStructureCards = tsCards;
    this.cardDefinitionUsage = cardUsage;

    this.benefitCards = this.buildBenefitCardsMap(entities.benefits);
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

  /** Recompute benefit → card definition direct map from benefit list. */
  refreshBenefitCards(benefits) {
    this.benefitCards = this.buildBenefitCardsMap(benefits);
  }

  /** Remove an earning rule from the benefit map and recalculate benefit usage. */
  removeEarningRule(id) {
    const { [id]: _removed, ...rest } = this.earningRuleBenefits;
    this.earningRuleBenefits = rest;

    const allBenefits = Object.values(this.earningRuleBenefits).flat();
    const benefitUsage = {};
    allBenefits.forEach((benefit) => {
      const benefitId = benefit.benefit_id || benefit.id;
      benefitUsage[benefitId] = (benefitUsage[benefitId] || 0) + 1;
    });
    this.entityUsage = { ...this.entityUsage, benefits: benefitUsage };
  }

  // ── Pure computation helpers ──────────────────────────────────────────────

  /** Build benefitId → cardDefinitionId map from benefit objects directly. */
  buildBenefitCardsMap(benefits) {
    const map = {};
    benefits.forEach((benefit) => {
      const cardDefId =
        benefit.points?.card_definition_id ??
        benefit.points_proportional?.card_definition_id ??
        null;
      if (cardDefId) map[benefit.id] = cardDefId;
    });
    return map;
  }

  calculateEntityUsage(programsWithAssignments) {
    const usage = {
      cardDefinitions: {},
      earningRules: {},
      benefits: {},
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

  async fetchBenefitsForEarningRules(earningRules) {
    const benefitMap = {};
    const benefitUsage = {};

    earningRules.forEach((earningRule) => {
      const benefitsInRule = [];

      if (earningRule.earnings && Array.isArray(earningRule.earnings)) {
        earningRule.earnings.forEach((earning) => {
          if (earning.effects && Array.isArray(earning.effects)) {
            earning.effects.forEach((effect) => {
              if (effect.type === 'BENEFIT' && effect.benefit?.id) {
                benefitsInRule.push({
                  benefit_id: effect.benefit.id,
                  id: effect.benefit.id,
                });
                benefitUsage[effect.benefit.id] =
                  (benefitUsage[effect.benefit.id] || 0) + 1;
              }
            });
          }
        });
      }

      if (benefitsInRule.length > 0) {
        benefitMap[earningRule.id] = benefitsInRule;
      }
    });

    return { benefitMap, benefitUsage };
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

  /**
   * Fetches every page of a cursor-paginated program-assignment list so
   * callers always see the full assignment set, not just the first page.
   * Only used when the caller explicitly wants everything (loadEverything).
   */
  async #fetchAllAssignmentPages(listFn) {
    let allData = [];
    let cursor = null;
    do {
      const res = await api.get(listFn(cursor ? { cursor } : {})).catch(() => ({ data: [], cursor: null }));
      allData = [...allData, ...(res.data || [])];
      cursor = res.cursor?.next || null;
    } while (cursor);
    return allData;
  }

  /** Fetches only the first page of a cursor-paginated assignment list. */
  async #fetchFirstAssignmentPage(listFn) {
    const res = await api.get(listFn({})).catch(() => ({ data: [], cursor: null }));
    return { data: res.data || [], hasMore: !!res.cursor?.next };
  }

  /**
   * Loads a program's assignment counts/entities. By default only fetches
   * the first page of each assignment type — full pagination only happens
   * on demand via `full: true` (the "Load Everything" action), so opening
   * the designer never silently walks every page for every program.
   */
  async fetchProgramAssignments(program, { full = false } = {}) {
    try {
      const membersPromise = api.get(endpoints.members.list(program.id, { limit: 1 }))
        .catch(() => ({ data: [], cursor: null }));

      let cardDefs, earningRules, rewards, tierStructs, membersRes;

      if (full) {
        [cardDefs, earningRules, rewards, tierStructs, membersRes] = await Promise.all([
          this.#fetchAllAssignmentPages((query) => endpoints.programs.cardDefinitions(program.id, query)),
          this.#fetchAllAssignmentPages((query) => endpoints.programs.earningRules(program.id, query)),
          this.#fetchAllAssignmentPages((query) => endpoints.programs.rewards(program.id, query)),
          this.#fetchAllAssignmentPages((query) => endpoints.programs.tierStructures(program.id, query)),
          membersPromise,
        ]);
      } else {
        let cardDefsPage, earningRulesPage, rewardsPage, tierStructsPage;
        [cardDefsPage, earningRulesPage, rewardsPage, tierStructsPage, membersRes] = await Promise.all([
          this.#fetchFirstAssignmentPage((query) => endpoints.programs.cardDefinitions(program.id, query)),
          this.#fetchFirstAssignmentPage((query) => endpoints.programs.earningRules(program.id, query)),
          this.#fetchFirstAssignmentPage((query) => endpoints.programs.rewards(program.id, query)),
          this.#fetchFirstAssignmentPage((query) => endpoints.programs.tierStructures(program.id, query)),
          membersPromise,
        ]);
        cardDefs = cardDefsPage.data;
        earningRules = earningRulesPage.data;
        rewards = rewardsPage.data;
        tierStructs = tierStructsPage.data;
        if (cardDefsPage.hasMore || earningRulesPage.hasMore || rewardsPage.hasMore || tierStructsPage.hasMore) {
          this.hasIncompleteAssignments = true;
        }
      }

      const membersCount = membersRes.data?.length > 0
        ? (membersRes.cursor ? '1+' : membersRes.data.length)
        : 0;

      return {
        ...program,
        assignments: {
          cardDefinitions: cardDefs.length,
          earningRules: earningRules.length,
          rewards: rewards.length,
          tierStructures: tierStructs.length,
        },
        assignedEntities: {
          cardDefinitions: cardDefs,
          earningRules: earningRules,
          rewards: rewards,
          tierStructures: tierStructs,
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
