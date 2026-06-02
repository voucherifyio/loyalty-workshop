/**
 * Assignment store — tracks pending assignment changes before a batch save.
 *
 * Designer.svelte calls resetForSelection() when the selected program changes,
 * and wires the save/discard actions to the child components.
 */
import { api } from '../../api/client.js';
import { endpoints } from '../../api/endpoints.js';
import { batchEndpointMap } from '../../config/designerConfig.js';
import { relationshipsStore } from './relationships.svelte.js';
import { getTierStructureCardDefId } from '../../utils/entityRelationships.js';

class AssignmentStore {
  pendingChanges = $state({
    toAssign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
    toUnassign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
    rewardStock: {},
  });

  initialRewardStock = $state({});
  tierStructureAssignPopover = $state(null);

  get hasPendingChanges() {
    const { toAssign, toUnassign } = this.pendingChanges;
    return (
      Object.values(toAssign).some((arr) => arr.length > 0) ||
      Object.values(toUnassign).some((arr) => arr.length > 0) ||
      this.#modifiedExistingRewardStock.length > 0
    );
  }

  get #modifiedExistingRewardStock() {
    return Object.entries(this.pendingChanges.rewardStock)
      .filter(([id, stock]) => {
        const initial = this.initialRewardStock[id];
        if (!initial) return false;
        if (stock.type !== initial.type) return true;
        if (stock.type === 'LIMITED') {
          return stock.limited?.quantity !== initial.limited?.quantity;
        }
        return false;
      })
      .map(([id]) => id);
  }

  /**
   * Called by Designer when the selected program changes.
   * Pre-populates existing reward stock from program data.
   */
  resetForSelection(selectionId, selectionType, programs) {
    this.tierStructureAssignPopover = null;

    const existingRewardStock = {};
    if (selectionType === 'program' && selectionId) {
      const program = programs.find((p) => p.id === selectionId);
      program?.assignedEntities?.rewards?.forEach((r) => {
        const id = r.reward_id || r.id;
        if (r.stock) {
          existingRewardStock[id] = {
            type: r.stock.type || 'UNLIMITED',
            limited: r.stock.type === 'LIMITED' && r.stock.limited 
              ? { quantity: r.stock.limited.quantity || 0 }
              : undefined,
          };
        }
      });
    }

    this.initialRewardStock = { ...existingRewardStock };
    this.pendingChanges = {
      toAssign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      toUnassign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      rewardStock: existingRewardStock,
    };
  }

  // ── Entity assignment state queries ─────────────────────────────────────────

  getAssignedEntityIds(entityType, selection, programs) {
    if (selection?.type !== 'program' || !selection?.id) return [];
    const program = programs.find((p) => p.id === selection.id);
    if (!program?.assignedEntities) return [];

    const idFieldMap = {
      cardDefinitions: 'card_definition_id',
      earningRules: 'earning_rule_id',
      rewards: 'reward_id',
      tierStructures: 'tier_structure_id',
    };

    const idField = idFieldMap[entityType];
    return (program.assignedEntities[entityType] || []).map((e) => e[idField] || e.id);
  }

  isEntityAssigned(entityType, id, selection, programs) {
    const originalIds = this.getAssignedEntityIds(entityType, selection, programs);
    const inOriginal = originalIds.includes(id);
    const inToAssign = this.pendingChanges.toAssign[entityType]?.includes(id) ?? false;
    const inToUnassign = this.pendingChanges.toUnassign[entityType]?.includes(id) ?? false;
    if (inToAssign) return true;
    if (inToUnassign) return false;
    return inOriginal;
  }

  getRewardCardDefinitions(selection, programs, entities) {
    if (selection?.type !== 'program' || !selection?.id) return [];
    const program = programs.find((p) => p.id === selection.id);
    if (!program?.assignedEntities?.cardDefinitions) return [];

    const assignedCardDefIds = program.assignedEntities.cardDefinitions.map(
      (cd) => cd.card_definition_id || cd.id
    );
    return entities.cardDefinitions.filter((cd) => assignedCardDefIds.includes(cd.id));
  }

  // ── Assignment mutations ───────────────────────────────────────────────────

  toggleEntityAssignment(entityType, id, selection, programs) {
    const currentlyAssigned = this.isEntityAssigned(entityType, id, selection, programs);
    const originalIds = this.getAssignedEntityIds(entityType, selection, programs);
    const inOriginal = originalIds.includes(id);

    if (currentlyAssigned) {
      this.pendingChanges = {
        ...this.pendingChanges,
        toAssign: {
          ...this.pendingChanges.toAssign,
          [entityType]: this.pendingChanges.toAssign[entityType].filter((x) => x !== id),
        },
        toUnassign: {
          ...this.pendingChanges.toUnassign,
          [entityType]: inOriginal && !this.pendingChanges.toUnassign[entityType].includes(id)
            ? [...this.pendingChanges.toUnassign[entityType], id]
            : this.pendingChanges.toUnassign[entityType],
        },
        rewardStock: entityType === 'rewards'
          ? Object.fromEntries(Object.entries(this.pendingChanges.rewardStock).filter(([k]) => k !== id))
          : this.pendingChanges.rewardStock,
      };
    } else {
      this.pendingChanges = {
        ...this.pendingChanges,
        toAssign: {
          ...this.pendingChanges.toAssign,
          [entityType]: !inOriginal && !this.pendingChanges.toAssign[entityType].includes(id)
            ? [...this.pendingChanges.toAssign[entityType], id]
            : this.pendingChanges.toAssign[entityType],
        },
        toUnassign: {
          ...this.pendingChanges.toUnassign,
          [entityType]: this.pendingChanges.toUnassign[entityType].filter((x) => x !== id),
        },
      };
    }
  }

  handleCardDefinitionToggle(cardDefId, entities, selection, programs) {
    const willUnassign = this.isEntityAssigned('cardDefinitions', cardDefId, selection, programs);
    if (willUnassign) {
      for (const ts of entities.tierStructures) {
        if (getTierStructureCardDefId(ts) === cardDefId && this.isEntityAssigned('tierStructures', ts.id, selection, programs)) {
          this.toggleEntityAssignment('tierStructures', ts.id, selection, programs);
        }
      }
      this.toggleEntityAssignment('cardDefinitions', cardDefId, selection, programs);
      return;
    }
    this.toggleEntityAssignment('cardDefinitions', cardDefId, selection, programs);
    const linked = entities.tierStructures.filter((ts) => getTierStructureCardDefId(ts) === cardDefId);
    if (linked.length > 0) {
      const cd = entities.cardDefinitions.find((c) => c.id === cardDefId);
      this.tierStructureAssignPopover = {
        cardDefId,
        options: linked,
        cardName: cd?.name || '',
      };
    }
  }

  cancelTierStructureAssignPopover(selection, programs) {
    if (!this.tierStructureAssignPopover) return;
    const { cardDefId } = this.tierStructureAssignPopover;
    this.tierStructureAssignPopover = null;
    this.toggleEntityAssignment('cardDefinitions', cardDefId, selection, programs);
  }

  applyTierStructureAssignPopover(tierStructureId, selection, programs, entities) {
    this.tierStructureAssignPopover = null;
    if (tierStructureId) {
      this.toggleTierStructureAssignment(tierStructureId, selection, programs, entities);
    }
  }

  toggleTierStructureAssignment(id, selection, programs, entities) {
    const currentlyAssigned = this.isEntityAssigned('tierStructures', id, selection, programs);
    if (currentlyAssigned) {
      this.toggleEntityAssignment('tierStructures', id, selection, programs);
    } else {
      const originalIds = this.getAssignedEntityIds('tierStructures', selection, programs);
      const allCurrentlyAssigned = entities.tierStructures
        .filter((ts) => this.isEntityAssigned('tierStructures', ts.id, selection, programs) && ts.id !== id);
      const newToAssign = originalIds.includes(id) ? [] : [id];
      const newToUnassign = [...originalIds, ...allCurrentlyAssigned.map((ts) => ts.id).filter((x) => !originalIds.includes(x))]
        .filter((x) => x !== id && !newToAssign.includes(x));
      this.pendingChanges = {
        ...this.pendingChanges,
        toAssign: { ...this.pendingChanges.toAssign, tierStructures: newToAssign },
        toUnassign: { ...this.pendingChanges.toUnassign, tierStructures: newToUnassign },
      };
    }
  }

  setRewardStock(rewardId, stockData) {
    this.pendingChanges = {
      ...this.pendingChanges,
      rewardStock: { ...this.pendingChanges.rewardStock, [rewardId]: stockData },
    };
  }

  cancelAllAssignments() {
    this.tierStructureAssignPopover = null;
    this.pendingChanges = {
      toAssign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      toUnassign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      rewardStock: { ...this.initialRewardStock },
    };
  }

  // ── Batch save ─────────────────────────────────────────────────────────────

  async saveAllAssignments(selection, programs) {
    if (!selection?.id) return;

    // Process assignments in strict order to ensure data consistency:
    // 1. Card definitions (wallets) - must be assigned first
    // 2. Tier structures - depend on card definitions
    // 3. Earning rules - may reference card definitions
    // 4. Rewards - processed separately after (below)
    for (const entityType of ['cardDefinitions', 'tierStructures', 'earningRules']) {
      const toAssign = this.pendingChanges.toAssign[entityType];
      const toUnassign = this.pendingChanges.toUnassign[entityType];
      if (toAssign.length === 0 && toUnassign.length === 0) continue;
      await this.#saveAssignmentBatch(entityType, toAssign, toUnassign, selection, programs);
    }

    // Process rewards last - they may reference card definitions for costs/stock
    const modifiedStock = this.#modifiedExistingRewardStock;
    const toAssignIds = [...this.pendingChanges.toAssign.rewards];
    const toUnassignIds = [...this.pendingChanges.toUnassign.rewards];
    const allToUnassign = [...new Set([...toUnassignIds, ...modifiedStock])];
    const allToAssignIds = [...new Set([...toAssignIds, ...modifiedStock])];
    const assignPayload = allToAssignIds.map((id) => {
      const stock = this.pendingChanges.rewardStock[id];
      if (stock) {
        const payload = { id, stock: { type: stock.type } };
        if (stock.type === 'LIMITED' && stock.limited) {
          payload.stock.limited = { quantity: stock.limited.quantity };
        }
        return payload;
      }
      return { id, stock: { type: 'UNLIMITED' } };
    });

    const pureUnassigns = allToUnassign.filter((id) => !allToAssignIds.includes(id));
    const reassigns = allToUnassign.filter((id) => allToAssignIds.includes(id));

    // First unassign rewards that need to be reassigned (to update stock)
    if (reassigns.length > 0) {
      await this.#saveAssignmentBatch('rewards', [], reassigns, selection, programs);
    }
    // Then process new assignments and pure unassignments
    if (assignPayload.length > 0 || pureUnassigns.length > 0) {
      await this.#saveAssignmentBatch('rewards', assignPayload, pureUnassigns, selection, programs);
    }

    this.pendingChanges = {
      toAssign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      toUnassign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      rewardStock: {},
    };
    this.initialRewardStock = {};
  }

  async #saveAssignmentBatch(entityType, toAssign, toUnassign, selection, programs) {
    if (!selection?.id) return;
    const programId = selection.id;
    const batchEndpointKey = batchEndpointMap[entityType];
    if (!batchEndpointKey) {
      return;
    }

    const payload = { options: { strict: true } };
    if (toAssign.length > 0) {
      payload.assign = toAssign.map((item) => (typeof item === 'string' ? { id: item } : item));
    }
    if (toUnassign.length > 0) {
      payload.unassign = toUnassign.map((id) => ({ id }));
    }

    await api.post(endpoints.programs[batchEndpointKey](programId), payload);

    const programIndex = programs.findIndex((p) => p.id === programId);
    if (programIndex !== -1) {
      const updatedProgram = await relationshipsStore.fetchProgramAssignments(programs[programIndex]);
      programs[programIndex] = updatedProgram;
    }

    relationshipsStore.refreshUsage(programs);
  }
}

export const assignmentStore = new AssignmentStore();
