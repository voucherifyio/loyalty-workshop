/**
 * Pagination store — cursor-based pagination state and countdown timers.
 * Exposes loadMore / refreshEntity / fetchAll / loadEverything.
 * All methods that mutate program/entity lists accept them as parameters
 * and return the updated values for Designer to store reactively.
 */
import { api } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { getEntityEndpoints } from '../../utils/entityCrud.js';
import { relationshipsStore } from './relationships.svelte.js';

const ENTITY_TYPES = ['programs', 'cardDefinitions', 'earningRules', 'benefits', 'rewards', 'tierStructures'];

function emptyPerType(defaultValue) {
  return Object.fromEntries(ENTITY_TYPES.map((k) => [k, defaultValue]));
}

class PaginationStore {
  cursors = $state(emptyPerType(null));
  cursorExpiry = $state(emptyPerType(null));
  cursorCountdown = $state(emptyPerType(''));
  hasMore = $state(emptyPerType(false));
  loadingMore = $state(emptyPerType(false));
  loading = $state(false);
  loadingAll = $state(false);
  error = $state(null);

  /**
   * True when any entity catalog still has a next-page cursor, or any
   * program's assignments were only partially fetched, i.e. the currently
   * loaded data is a partial view. Drives the "Load Everything" highlight
   * so users know more data exists without us eagerly fetching it.
   */
  get hasIncompleteData() {
    return ENTITY_TYPES.some((type) => this.hasMore[type]) || relationshipsStore.hasIncompleteAssignments;
  }

  updateCountdowns() {
    const now = Date.now();
    const next = { ...this.cursorCountdown };

    ENTITY_TYPES.forEach((type) => {
      if (this.cursorExpiry[type]) {
        const remaining = new Date(this.cursorExpiry[type]).getTime() - now;
        if (remaining <= 0) {
          next[type] = 'expired';
        } else {
          const m = Math.floor(remaining / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          next[type] = `${m}m ${s}s`;
        }
      } else {
        next[type] = '';
      }
    });

    this.cursorCountdown = next;
  }

  #storeCursor(type, res) {
    this.cursors[type] = res.cursor?.next || null;
    this.cursorExpiry[type] = res.cursor?.expires_at || null;
    this.hasMore[type] = !!res.cursor?.next;
  }

  /**
   * Load the next page for an entity type.
   * Returns { programs?, entities? } with the updated lists.
   */
  async loadMore(entityType, programs, entities) {
    if (!this.cursors[entityType] || this.loadingMore[entityType]) return null;

    this.loadingMore[entityType] = true;
    try {
      const res = await api.get(
        getEntityEndpoints(entityType).list({ limit: 5, cursor: this.cursors[entityType] })
      );

      this.#storeCursor(entityType, res);

      if (entityType === 'programs') {
        const fetched = await Promise.all(
          (res.data || []).map((p) => relationshipsStore.fetchProgramAssignments(p))
        );
        const newPrograms = [...programs, ...fetched];
        relationshipsStore.refreshUsage(newPrograms);
        return { programs: newPrograms };
      }

      return { entities: { ...entities, [entityType]: [...entities[entityType], ...(res.data || [])] } };
    } catch {
      return null;
    } finally {
      this.loadingMore[entityType] = false;
    }
  }

  /**
   * Refresh a full entity list (reset to first page).
   * Returns { programs?, entities? }.
   */
  async refreshEntity(entityType, programs, entities) {
    this.loadingMore[entityType] = true;
    try {
      const res = await api.get(getEntityEndpoints(entityType).list({ limit: 5 }));

      this.#storeCursor(entityType, res);

      if (entityType === 'programs') {
        const fetched = await Promise.all(
          (res.data || []).map((p) => relationshipsStore.fetchProgramAssignments(p))
        );
        relationshipsStore.refreshUsage(fetched);
        return { programs: fetched };
      }

      return { entities: { ...entities, [entityType]: res.data || [] } };
    } catch {
      return null;
    } finally {
      this.loadingMore[entityType] = false;
    }
  }

  /**
   * Initial data load — first page of all entity types.
   * Returns { programs, entities }.
   */
  async fetchAll() {
    this.loading = true;
    this.error = null;
    relationshipsStore.hasIncompleteAssignments = false;

    try {
      const [
        programsRes, cardDefinitionsRes, earningRulesRes,
        benefitsRes, rewardsRes, tierStructuresRes,
      ] = await Promise.all([
        api.get(endpoints.programs.list({ limit: 5 })).catch(() => ({ data: [] })),
        api.get(endpoints.cardDefinitions.list({ limit: 5 })).catch(() => ({ data: [] })),
        api.get(endpoints.earningRules.list({ limit: 5 })).catch(() => ({ data: [] })),
        api.get(endpoints.benefits.list({ limit: 5 })).catch(() => ({ data: [] })),
        api.get(endpoints.rewards.list({ limit: 5 })).catch(() => ({ data: [] })),
        api.get(endpoints.tierStructures.list({ limit: 5 })).catch(() => ({ data: [] })),
      ]);

      const programsWithAssignments = await Promise.all(
        (programsRes.data || []).map((p) => relationshipsStore.fetchProgramAssignments(p))
      );

      const entities = {
        cardDefinitions: cardDefinitionsRes.data || [],
        earningRules: earningRulesRes.data || [],
        benefits: benefitsRes.data || [],
        rewards: rewardsRes.data || [],
        tierStructures: tierStructuresRes.data || [],
      };

      // Store cursors
      const allRes = { programs: programsRes, cardDefinitions: cardDefinitionsRes, earningRules: earningRulesRes, benefits: benefitsRes, rewards: rewardsRes, tierStructures: tierStructuresRes };
      ENTITY_TYPES.forEach((type) => this.#storeCursor(type, allRes[type]));

      this.updateCountdowns();

      await relationshipsStore.refreshAll(programsWithAssignments, entities);

      return { programs: programsWithAssignments, entities };
    } catch (err) {
      this.error = err.message || 'Failed to fetch data';
      return null;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Load all pages (no pagination limits). Returns { programs, entities }.
   */
  async loadEverything() {
    this.loadingAll = true;
    this.error = null;

    try {
      async function fetchAllPages(listFn) {
        let allData = [];
        let cursor = null;
        do {
          const res = await api.get(listFn(cursor ? { cursor } : {}));
          allData = [...allData, ...(res.data || [])];
          cursor = res.cursor?.next || null;
        } while (cursor);
        return allData;
      }

      const [
        allPrograms, allCardDefinitions, allEarningRules,
        allBenefits, allRewards, allTierStructures,
      ] = await Promise.all([
        fetchAllPages(endpoints.programs.list),
        fetchAllPages(endpoints.cardDefinitions.list),
        fetchAllPages(endpoints.earningRules.list),
        fetchAllPages(endpoints.benefits.list),
        fetchAllPages(endpoints.rewards.list),
        fetchAllPages(endpoints.tierStructures.list),
      ]);

      const programsWithAssignments = await Promise.all(
        allPrograms.map((p) => relationshipsStore.fetchProgramAssignments(p, { full: true }))
      );

      const entities = {
        cardDefinitions: allCardDefinitions,
        earningRules: allEarningRules,
        benefits: allBenefits,
        rewards: allRewards,
        tierStructures: allTierStructures,
      };

      // Clear all cursors
      ENTITY_TYPES.forEach((type) => {
        this.cursors[type] = null;
        this.cursorExpiry[type] = null;
        this.hasMore[type] = false;
      });
      relationshipsStore.hasIncompleteAssignments = false;

      relationshipsStore.refreshUsage(programsWithAssignments);
      this.updateCountdowns();

      return { programs: programsWithAssignments, entities };
    } catch (err) {
      this.error = err.message || 'Failed to load all data';
      return null;
    } finally {
      this.loadingAll = false;
    }
  }
}

export const paginationStore = new PaginationStore();
