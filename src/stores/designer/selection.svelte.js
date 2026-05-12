/**
 * Selection store — which program or entity is currently highlighted.
 * Drives the assignment mode and cross-entity visual highlighting.
 */

class SelectionStore {
  selection = $state({
    type: null,   // 'program' | 'entity' | null
    category: null, // 'cardDefinitions' | 'earningRules' | etc.
    id: null,
  });

  get assignmentActive() {
    return this.selection?.type === 'program' && !!this.selection.id;
  }

  toggleProgram(programId) {
    if (this.selection?.type === 'program' && this.selection.id === programId) {
      this.selection = { type: null, category: null, id: null };
    } else {
      this.selection = { type: 'program', category: null, id: programId };
    }
  }

  toggleEntity(category, entityId) {
    if (
      this.selection?.type === 'entity' &&
      this.selection.category === category &&
      this.selection.id === entityId
    ) {
      this.selection = { type: null, category: null, id: null };
    } else {
      this.selection = { type: 'entity', category, id: entityId };
    }
  }

  clear() {
    this.selection = { type: null, category: null, id: null };
  }
}

export const selectionStore = new SelectionStore();
