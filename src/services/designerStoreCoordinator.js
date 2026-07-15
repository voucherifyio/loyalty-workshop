/**
 * Creates coordinated store accessor functions for Designer component
 * This reduces boilerplate by binding store methods with runtime state
 * 
 * @param {Object} stores - The stores to coordinate
 * @param {Function} getSelection - Function that returns current selection
 * @param {Function} getPrograms - Function that returns programs array
 * @param {Function} getEntities - Function that returns entities object
 * @returns {Object} Coordinated store methods
 */
export function createStoreCoordinator(stores, getSelection, getPrograms, getEntities) {
  const { selectionStore, assignmentStore, relationshipsStore } = stores;

  return {
    // Selection store methods
    toggleProgram: (id) => selectionStore.toggleProgram(id),
    toggleEntity: (cat, id) => selectionStore.toggleEntity(cat, id),
    clear: () => selectionStore.clear(),
    get assignmentActive() {
      return selectionStore.assignmentActive;
    },
    get selection() {
      return selectionStore.selection;
    },

    // Assignment store methods
    isEntityAssigned: (entityType, id) => {
      return assignmentStore.isEntityAssigned(entityType, id, getSelection(), getPrograms());
    },
    toggleEntityAssignment: (entityType, id) => {
      assignmentStore.toggleEntityAssignment(entityType, id, getSelection(), getPrograms());
    },
    toggleTierStructureAssignment: (id) => {
      assignmentStore.toggleTierStructureAssignment(id, getSelection(), getPrograms(), getEntities());
    },
    handleCardDefinitionToggle: (cardDefId) => {
      assignmentStore.handleCardDefinitionToggle(cardDefId, getEntities(), getSelection(), getPrograms());
    },
    getAssignedEntityIds: (entityType) => {
      return assignmentStore.getAssignedEntityIds(entityType, getSelection(), getPrograms());
    },
    getRewardCardDefinitions: () => {
      return assignmentStore.getRewardCardDefinitions(getSelection(), getPrograms(), getEntities());
    },
    setRewardStock: (rewardId, stockData) => {
      assignmentStore.setRewardStock(rewardId, stockData);
    },
    saveAllAssignments: async () => {
      await assignmentStore.saveAllAssignments(getSelection(), getPrograms());
    },
    cancelAllAssignments: () => {
      assignmentStore.cancelAllAssignments();
    },
    cancelTierStructureAssignPopover: () => {
      assignmentStore.cancelTierStructureAssignPopover(getSelection(), getPrograms());
    },
    applyTierStructureAssignPopover: (tierStructureId) => {
      assignmentStore.applyTierStructureAssignPopover(tierStructureId, getSelection(), getPrograms(), getEntities());
    },
    get hasPendingChanges() {
      return assignmentStore.hasPendingChanges;
    },
    get pendingChanges() {
      return assignmentStore.pendingChanges;
    },
    get tierStructureAssignPopover() {
      return assignmentStore.tierStructureAssignPopover;
    },

    // Relationships store methods
    get entityUsage() {
      return relationshipsStore.entityUsage;
    },
    get earningRuleCards() {
      return relationshipsStore.earningRuleCards;
    },
    get tierStructureCards() {
      return relationshipsStore.tierStructureCards;
    },
    get earningRuleBenefits() {
      return relationshipsStore.earningRuleBenefits;
    },
    get benefitCards() {
      return relationshipsStore.benefitCards;
    },
    refreshUsage: (programs) => {
      relationshipsStore.refreshUsage(programs);
    },
    refreshCardRelationships: (earningRules, tierStructures) => {
      relationshipsStore.refreshCardRelationships(earningRules, tierStructures);
    },
    refreshBenefitCards: (benefits) => {
      relationshipsStore.refreshBenefitCards(benefits);
    },
    removeEarningRule: (id) => {
      relationshipsStore.removeEarningRule(id);
    },
    resetForSelection: (id, type, programs) => {
      assignmentStore.resetForSelection(id, type, programs);
    },
  };
}
