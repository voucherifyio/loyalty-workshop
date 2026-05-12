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
    rewardCosts: {},
  });

  initialRewardCosts = $state({});
  tierStructureAssignPopover = $state(null);

  get hasPendingChanges() {
    const { toAssign, toUnassign } = this.pendingChanges;
    return (
      Object.values(toAssign).some((arr) => arr.length > 0) ||
      Object.values(toUnassign).some((arr) => arr.length > 0) ||
      this.#modifiedExistingRewardCosts.length > 0
    );
  }

  get #modifiedExistingRewardCosts() {
    return Object.entries(this.pendingChanges.rewardCosts)
      .filter(([id, cost]) => {
        const initial = this.initialRewardCosts[id];
        if (!initial) return false;
        return (
          cost.card_definition_id !== initial.card_definition_id ||
          cost.points !== initial.points ||
          cost.stock !== initial.stock
        );
      })
      .map(([id]) => id);
  }

  /**
   * Called by Designer when the selected program changes.
   * Pre-populates existing reward costs from program data.
   */
  resetForSelection(selectionId, selectionType, programs) {
    this.tierStructureAssignPopover = null;

    const existingRewardCosts = {};
    if (selectionType === 'program' && selectionId) {
      const program = programs.find((p) => p.id === selectionId);
      program?.assignedEntities?.rewards?.forEach((r) => {
        const id = r.reward_id || r.id;
        const spending = r.costs?.[0]?.spending?.[0];
        if (spending) {
          existingRewardCosts[id] = {
            card_definition_id: spending.card_definition_id || '',
            points: spending.points || 0,
            stock: r.stock || 0,
          };
        }
      });
    }

    this.initialRewardCosts = { ...existingRewardCosts };
    this.pendingChanges = {
      toAssign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      toUnassign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      rewardCosts: existingRewardCosts,
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
        rewardCosts: entityType === 'rewards'
          ? Object.fromEntries(Object.entries(this.pendingChanges.rewardCosts).filter(([k]) => k !== id))
          : this.pendingChanges.rewardCosts,
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

  setRewardCost(rewardId, costData) {
    this.pendingChanges = {
      ...this.pendingChanges,
      rewardCosts: { ...this.pendingChanges.rewardCosts, [rewardId]: costData },
    };
  }

  cancelAllAssignments() {
    this.tierStructureAssignPopover = null;
    this.pendingChanges = {
      toAssign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      toUnassign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      rewardCosts: { ...this.initialRewardCosts },
    };
  }

  // ── Batch save ─────────────────────────────────────────────────────────────

  async saveAllAssignments(selection, programs) {
    if (!selection?.id) return;

    for (const entityType of ['cardDefinitions', 'tierStructures', 'earningRules']) {
      const toAssign = this.pendingChanges.toAssign[entityType];
      const toUnassign = this.pendingChanges.toUnassign[entityType];
      if (toAssign.length === 0 && toUnassign.length === 0) continue;
      await this.#saveAssignmentBatch(entityType, toAssign, toUnassign, selection, programs);
    }

    const modifiedCosts = this.#modifiedExistingRewardCosts;
    const toAssignIds = [...this.pendingChanges.toAssign.rewards];
    const toUnassignIds = [...this.pendingChanges.toUnassign.rewards];
    const allToUnassign = [...new Set([...toUnassignIds, ...modifiedCosts])];
    const allToAssignIds = [...new Set([...toAssignIds, ...modifiedCosts])];
    const assignPayload = allToAssignIds.map((id) => {
      const cost = this.pendingChanges.rewardCosts[id];
      if (cost?.card_definition_id && cost?.points) {
        return {
          id,
          stock: cost.stock || 0,
          costs: [{ spending: [{ card_definition_id: cost.card_definition_id, points: cost.points }] }],
        };
      }
      return { id };
    });

    const pureUnassigns = allToUnassign.filter((id) => !allToAssignIds.includes(id));
    const reassigns = allToUnassign.filter((id) => allToAssignIds.includes(id));

    if (reassigns.length > 0) {
      await this.#saveAssignmentBatch('rewards', [], reassigns, selection, programs);
    }
    if (assignPayload.length > 0 || pureUnassigns.length > 0) {
      await this.#saveAssignmentBatch('rewards', assignPayload, pureUnassigns, selection, programs);
    }

    this.pendingChanges = {
      toAssign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      toUnassign: { cardDefinitions: [], earningRules: [], rewards: [], tierStructures: [] },
      rewardCosts: {},
    };
    this.initialRewardCosts = {};
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
