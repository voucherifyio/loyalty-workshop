<script>
  import { untrack } from "svelte";
  import { push } from "svelte-spa-router";
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import * as entityCrudService from "../services/entityCrudService.js";
  import CreateEntityDrawer from "../components/CreateEntityDrawer.svelte";
  import EntityDrawer from "../components/EntityDrawer.svelte";
  import AssignmentSaveBar from "../components/AssignmentSaveBar.svelte";
  import AssignmentModeInfo from "../components/AssignmentModeInfo.svelte";
  import PointsSection from "../components/PointsSection.svelte";
  import WalletsSection from "../components/WalletsSection.svelte";
  import ProgramsSection from "../components/ProgramsSection.svelte";
  import TierStructureAssignPopover from "../components/TierStructureAssignPopover.svelte";
  import {
    samplePayloads,
    entityLabels,
  } from "../config/designerConfig.js";
  import { getTierStructureCardDefId } from "../utils/entityRelationships.js";
  import { getProgramClasses, getEntityClasses } from "../utils/entityStyles.js";
  import { toast } from "../services/toast.js";
  import { selectionStore } from "../stores/designer/selection.svelte.js";
  import { paginationStore } from "../stores/designer/pagination.svelte.js";
  import { assignmentStore } from "../stores/designer/assignment.svelte.js";
  import { relationshipsStore } from "../stores/designer/relationships.svelte.js";
  import { setDesignerActions } from "../stores/designerActions.svelte.js";
  import { createStoreCoordinator } from "../services/designerStoreCoordinator.js";

  // ── Core data state ──────────────────────────────────────────────────────
  let programs = $state([]);
  let entities = $state({
    cardDefinitions: [],
    earningRules: [],
    benefits: [],
    rewards: [],
    tierStructures: [],
  });

  // ── UI-only state ─────────────────────────────────────────────────────────
  let entityDrawer = $state({
    open: false, activeTab: "details", entityType: null, entityId: null,
    item: null, entityData: {}, updateEndpoint: "", activitiesEndpoint: "", prefillData: null,
  });
  let createModal = $state({ open: false, entityType: null, prefillData: null });
  let expandedTierStructures = $state({});

  // CRUD visual feedback
  let deletingEntity = $state(null);
  let confirmingDelete = $state(null);
  let hoveredCard = $state(null);
  let shakeCard = $state(null);
  let removingCard = $state(null);
  let changingStatus = $state(null);
  let confirmingStatusChange = $state(null);

  // ── Derived ───────────────────────────────────────────────────────────────
  const tiersByCardDef = $derived(() => {
    const map = {};
    entities.tierStructures.forEach((ts) => {
      const cardDefId = getTierStructureCardDefId(ts);
      if (cardDefId) {
        if (!map[cardDefId]) map[cardDefId] = [];
        map[cardDefId].push(ts);
      }
    });
    return map;
  });

  const orphanTierStructures = $derived(() =>
    entities.tierStructures.filter((ts) => !getTierStructureCardDefId(ts))
  );

  // ── Effects ───────────────────────────────────────────────────────────────

  // Reset assignment pending state when the selected program changes
  $effect(() => {
    const { id, type } = selectionStore.selection;
    // Avoid reading programs reactively during reset (untrack prevents extra runs)
    storeCoord.resetForSelection(id, type, untrack(() => programs));
  });

  // Initial data load + countdown interval
  $effect(() => {
    loadData();
    const interval = setInterval(() => paginationStore.updateCountdowns(), 1000);
    return () => clearInterval(interval);
  });

  // Auto-load tiers for all tier structures when they change
  $effect(() => {
    const tierStructureIds = entities.tierStructures?.map(ts => ts.id) || [];
    
    // Load tiers for tier structures that aren't already expanded
    tierStructureIds.forEach(async (tsId) => {
      if (!(tsId in expandedTierStructures)) {
        // Set to undefined to show loading state
        expandedTierStructures = { ...expandedTierStructures, [tsId]: undefined };
        try {
          const response = await api.get(endpoints.tierStructures.tiers.list(tsId));
          expandedTierStructures = { ...expandedTierStructures, [tsId]: response.data || [] };
        } catch {
          // On error, set to empty array instead of showing loading forever
          expandedTierStructures = { ...expandedTierStructures, [tsId]: [] };
        }
      }
    });
  });

  // Expose actions to TopBar via store
  $effect(() => {
    setDesignerActions({
      fetchAll: loadData,
      loadEverything,
      get loading() { return paginationStore.loading; },
      get loadingAll() { return paginationStore.loadingAll; },
    });
    return () => setDesignerActions(null);
  });

  // ── Data loading ──────────────────────────────────────────────────────────
  async function loadData() {
    const result = await paginationStore.fetchAll();
    if (result) {
      programs = result.programs;
      entities = result.entities;
    }
  }

  async function loadEverything() {
    const result = await paginationStore.loadEverything();
    if (result) {
      programs = result.programs;
      entities = result.entities;
    }
  }

  async function loadMore(entityType) {
    const result = await paginationStore.loadMore(entityType, programs, entities);
    if (result?.programs) programs = result.programs;
    if (result?.entities) entities = result.entities;
  }

  async function refreshEntity(entityType) {
    const result = await paginationStore.refreshEntity(entityType, programs, entities);
    if (result?.programs) programs = result.programs;
    if (result?.entities) entities = result.entities;
    if (entityType !== 'programs') {
      storeCoord.refreshCardRelationships(entities.earningRules, entities.tierStructures);
    }
    if (entityType === 'benefits') {
      storeCoord.refreshBenefitCards(entities.benefits);
    }
  }

  // ── CRUD operations ───────────────────────────────────────────────────────
  async function changeEntityStatus(entityType, id, action, toStatus) {
    changingStatus = { type: entityType, id, action };
    try {
      await entityCrudService.changeEntityStatus(entityType, id, action);
      if (entityType === "programs") {
        programs = programs.map((p) => p.id === id ? { ...p, status: toStatus } : p);
      } else {
        entities[entityType] = entities[entityType].map((e) => e.id === id ? { ...e, status: toStatus } : e);
      }
      confirmingStatusChange = null;
      changingStatus = null;
    } catch (err) {
      shakeCard = { type: entityType, id };
      changingStatus = null;
      setTimeout(() => { shakeCard = null; }, 500);
      throw err;
    }
  }

  async function deleteEntity(entityType, id) {
    deletingEntity = { type: entityType, id };
    try {
      await entityCrudService.deleteEntity(entityType, id);
      
      // Close drawer if it's showing the deleted entity
      if (entityDrawer.open && entityDrawer.entityType === entityType && entityDrawer.entityId === id) {
        closeEntityDrawer();
      }
      
      removingCard = { type: entityType, id };
      setTimeout(() => {
        if (entityType === "programs") {
          programs = programs.filter((p) => p.id !== id);
        } else {
          entities[entityType] = entities[entityType].filter((e) => e.id !== id);
        }
        storeCoord.refreshUsage(programs);
        if (entityType === "earningRules") {
          storeCoord.removeEarningRule(id);
        }
        if (["cardDefinitions", "earningRules", "tierStructures"].includes(entityType)) {
          storeCoord.refreshCardRelationships(entities.earningRules, entities.tierStructures);
        }
        removingCard = null;
        if (
          (entityType === "programs" && storeCoord.selection?.type === "program" && storeCoord.selection.id === id) ||
          (storeCoord.selection?.type === "entity" && storeCoord.selection.category === entityType && storeCoord.selection.id === id)
        ) {
          storeCoord.clear();
        }
      }, 300);
      confirmingDelete = null;
      deletingEntity = null;
    } catch (err) {
      shakeCard = { type: entityType, id };
      deletingEntity = null;
      setTimeout(() => { shakeCard = null; }, 500);
      throw err;
    }
  }

  // ── Drawer helpers ────────────────────────────────────────────────────────
  function findEntityById(entityType, id) {
    if (entityType === "programs") return programs.find((p) => p.id === id) || null;
    if (entityType === "tiers") {
      // Tiers are nested in expandedTierStructures
      for (const tiers of Object.values(expandedTierStructures)) {
        if (Array.isArray(tiers)) {
          const tier = tiers.find((t) => t.id === id);
          if (tier) return tier;
        }
      }
      return null;
    }
    return (entities[entityType] || []).find((e) => e.id === id) || null;
  }

  function openDetailDrawer(entityType, id) {
    const item = findEntityById(entityType, id);
    if (!item) return;
    
    // For tiers, we need the tierStructureId for the endpoint
    let updateEndpoint = "";
    let activitiesEndpoint = "";
    let prefillData = null;
    
    if (entityType === "tiers") {
      // Find which tier structure this tier belongs to
      let tierStructureId = null;
      for (const [tsId, tiers] of Object.entries(expandedTierStructures)) {
        if (Array.isArray(tiers) && tiers.find((t) => t.id === id)) {
          tierStructureId = tsId;
          break;
        }
      }
      if (tierStructureId) {
        updateEndpoint = endpoints.tierStructures.tiers.update(tierStructureId, id);
        prefillData = { tierStructureId };
      }
    } else {
      updateEndpoint = endpoints[entityType]?.update?.(id) || "";
      activitiesEndpoint = endpoints[entityType]?.activities?.(id) || "";
    }
    
    entityDrawer = {
      open: true, activeTab: "details", entityType, entityId: id, item,
      entityData: item, // Use the item data directly (no GET needed for tiers)
      updateEndpoint,
      activitiesEndpoint,
      prefillData,
    };
  }

  function closeEntityDrawer() {
    entityDrawer = {
      open: false, activeTab: "details", entityType: null, entityId: null,
      item: null, entityData: {}, updateEndpoint: "", activitiesEndpoint: "", prefillData: null,
    };
  }

  async function openEditModal(entityType, entityId) {
    const item = findEntityById(entityType, entityId);
    try {
      const data = await api.get(endpoints[entityType].get(entityId));
      entityDrawer = {
        open: true, activeTab: "edit", entityType, entityId,
        item: item || null, entityData: data,
        updateEndpoint: endpoints[entityType].update(entityId),
        activitiesEndpoint: endpoints[entityType]?.activities?.(entityId) || "",
        prefillData: null,
      };
    } catch {
      toast.error('Failed to load entity for editing');
    }
  }

  function openEditTier(tierStructureId, tierId) {
    // Find the tier in the already-loaded expandedTierStructures
    const tiers = expandedTierStructures[tierStructureId] || [];
    const tierData = tiers.find(t => t.id === tierId);
    
    if (!tierData) {
      toast.error('Tier not found. Please expand the tier structure first.');
      return;
    }
    
    entityDrawer = {
      open: true,
      activeTab: "details",
      entityType: "tiers",
      entityId: tierId,
      item: tierData, // Use the tier as the item
      entityData: tierData, // Pass the tier data directly
      updateEndpoint: endpoints.tierStructures.tiers.update(tierStructureId, tierId),
      activitiesEndpoint: "",
      prefillData: { tierStructureId },
    };
  }

  async function deleteTier(tierStructureId, tierId) {
    try {
      await api.delete(endpoints.tierStructures.tiers.delete(tierStructureId, tierId));
      
      // Close drawer if it's showing the deleted tier
      if (entityDrawer.open && entityDrawer.entityType === "tiers" && entityDrawer.entityId === tierId) {
        closeEntityDrawer();
      }
      
      const response = await api.get(endpoints.tierStructures.tiers.list(tierStructureId));
      expandedTierStructures = { ...expandedTierStructures, [tierStructureId]: response.data || [] };
      toast.success('Tier deleted successfully');
    } catch (err) {
      toast.error('Failed to delete tier');
      throw err;
    }
  }

  async function refreshTiers(tierStructureId) {
    // Refresh tiers for a specific tier structure
    try {
      expandedTierStructures = { ...expandedTierStructures, [tierStructureId]: undefined };
      const response = await api.get(endpoints.tierStructures.tiers.list(tierStructureId));
      expandedTierStructures = { ...expandedTierStructures, [tierStructureId]: response.data || [] };
    } catch {
      toast.error('Failed to load tiers');
      const { [tierStructureId]: _, ...rest } = expandedTierStructures;
      expandedTierStructures = rest;
    }
  }

  async function toggleTierStructureExpand(tierStructureId) {
    if (expandedTierStructures[tierStructureId]) {
      const { [tierStructureId]: _, ...rest } = expandedTierStructures;
      expandedTierStructures = rest;
    } else {
      // Set to undefined to show loading indicator
      expandedTierStructures = { ...expandedTierStructures, [tierStructureId]: undefined };
      try {
        const response = await api.get(endpoints.tierStructures.tiers.list(tierStructureId));
        expandedTierStructures = { ...expandedTierStructures, [tierStructureId]: response.data || [] };
      } catch {
        toast.error('Failed to load tiers');
        // Remove from expanded on error
        const { [tierStructureId]: _, ...rest } = expandedTierStructures;
        expandedTierStructures = rest;
      }
    }
  }

  function handleNavigateToProgram(programId) {
    push(`/programs/${programId}`);
  }

  function openCreateModal(entityType, prefillData = null) {
    createModal = { open: true, entityType, prefillData };
  }
  function openCreateTierForCardDef(cardDefId) {
    createModal = { open: true, entityType: "tierStructures", prefillData: { point_balance: { card_definition_id: cardDefId } } };
  }
  function openCreateTier(tierStructureId) {
    createModal = { open: true, entityType: "tiers", prefillData: { tierStructureId } };
  }
  function closeCreateModal() {
    createModal = { open: false, entityType: null, prefillData: null };
  }

  // ── Status/delete UI helpers ───────────────────────────────────────────────
  function getAvailableStatusTransitions(entityType, currentStatus) {
    if (entityType === "benefits") {
      if (currentStatus === "DRAFT") return [{ action: "activate", toStatus: "ACTIVE", label: "Activate", icon: "play" }];
      if (currentStatus === "ACTIVE") return [{ action: "draft", toStatus: "DRAFT", label: "Move to Draft", icon: "document" }];
      return [];
    }
    if (currentStatus === "DRAFT") return [{ action: "activate", toStatus: "ACTIVE", label: "Activate", icon: "play" }];
    if (currentStatus === "ACTIVE") return [
      { action: "deactivate", toStatus: "INACTIVE", label: "Deactivate", icon: "pause" },
      { action: "draft", toStatus: "DRAFT", label: "Move to Draft", icon: "document" },
    ];
    if (currentStatus === "INACTIVE") return [{ action: "activate", toStatus: "ACTIVE", label: "Activate", icon: "play" }];
    return [];
  }

  function startStatusChange(type, id, fromStatus, toStatus, action) {
    confirmingStatusChange = { type, id, fromStatus, toStatus, action };
  }
  function cancelStatusChange() { confirmingStatusChange = null; hoveredCard = null; }
  function startDelete(type, id) { confirmingDelete = { type, id }; }
  function cancelDelete() { confirmingDelete = null; hoveredCard = null; }

  // ── CSS class wrappers ────────────────────────────────────────────────────
  function entityClasses(entityType, entity) {
    return getEntityClasses(
      entityType, entity, storeCoord.selection, removingCard, shakeCard,
      storeCoord.earningRuleCards, storeCoord.tierStructureCards,
      storeCoord.earningRuleBenefits, storeCoord.benefitCards, programs
    );
  }
  function programClasses(program) {
    return getProgramClasses(
      program, storeCoord.selection, removingCard, shakeCard,
      storeCoord.earningRuleBenefits, programs
    );
  }

  // ── Store coordinator ─────────────────────────────────────────────────────
  const storeCoord = createStoreCoordinator(
    { selectionStore, assignmentStore, relationshipsStore },
    () => selectionStore.selection,
    () => programs,
    () => entities
  );

  // Wrapper for saveAllAssignments to trigger reactivity
  async function saveAllAssignments() {
    await storeCoord.saveAllAssignments();
    programs = [...programs]; // Trigger reactivity after in-place mutations
  }
</script>

<div class="p-6 space-y-6">
  <!-- Error Alert -->
  {#if paginationStore.error}
    <div class="alert alert-error mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{paginationStore.error}</span>
    </div>
  {/if}

  <!-- Programs Section -->
  <div class="bg-base-200/50 rounded-xl p-5 space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Programs</p>
      <button class="btn btn-circle btn-xs btn-primary" onclick={() => openCreateModal("programs")} title="Create Program">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>

    <ProgramsSection
      {programs}
      loading={paginationStore.loading}
      loadingMore={paginationStore.loadingMore}
      hasMore={paginationStore.hasMore}
      cursorCountdown={paginationStore.cursorCountdown}
      {shakeCard}
      {removingCard}
      {confirmingDelete}
      {confirmingStatusChange}
      {deletingEntity}
      {changingStatus}
      {hoveredCard}
      assignmentActive={storeCoord.assignmentActive}
      getClasses={programClasses}
      {getAvailableStatusTransitions}
      onCreate={openCreateModal}
      onEdit={openEditModal}
      onSelect={storeCoord.toggleProgram}
      onStartDelete={startDelete}
      onCancelDelete={cancelDelete}
      onDelete={deleteEntity}
      onStartStatusChange={startStatusChange}
      onCancelStatusChange={cancelStatusChange}
      onStatusChange={changeEntityStatus}
      onExpand={openDetailDrawer}
      onNavigate={handleNavigateToProgram}
      onLoadMore={() => loadMore("programs")}
      onRefresh={() => refreshEntity("programs")}
      onHoverChange={(value) => { hoveredCard = value; }}
    />
  </div>

  <!-- Assignment Mode Info Banner -->
  {#if storeCoord.assignmentActive}
    {@const selectedProgram = programs.find(p => p.id === storeCoord.selection.id)}
    <AssignmentModeInfo 
      programName={selectedProgram?.name || selectedProgram?.id || ''}
      onClose={storeCoord.clear}
    />
  {/if}

  <!-- Wallets Section -->
  <div class="bg-base-200/50 rounded-xl p-5 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Wallets</p>
        {#if selectionStore.assignmentActive}
          <span class="badge badge-xs badge-ghost text-base-content/50">Click checkboxes to assign</span>
        {/if}
      </div>
      <button class="btn btn-circle btn-xs btn-primary" onclick={() => openCreateModal("cardDefinitions")} title="Create Card Definition">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>

    <WalletsSection
      cardDefinitions={entities.cardDefinitions}
      tierStructures={entities.tierStructures}
      {tiersByCardDef}
      {orphanTierStructures}
      {expandedTierStructures}
      loading={paginationStore.loading}
      hasMore={paginationStore.hasMore}
      entityUsage={storeCoord.entityUsage}
      {shakeCard}
      {removingCard}
      assignmentActive={storeCoord.assignmentActive}
      isEntityAssigned={storeCoord.isEntityAssigned}
      toggleTierStructureAssignment={storeCoord.toggleTierStructureAssignment}
      toggleEntityAssignment={storeCoord.toggleEntityAssignment}
      onToggleCardDefinitionAssignment={storeCoord.handleCardDefinitionToggle}
      selection={storeCoord.selection}
      getClasses={entityClasses}
      onCreate={openCreateModal}
      onCreateTierForCardDef={openCreateTierForCardDef}
      onCreateTier={openCreateTier}
      onEdit={openEditModal}
      onEditTier={openEditTier}
      onDelete={deleteEntity}
      onDeleteTier={deleteTier}
      onStatusChange={changeEntityStatus}
      onSelect={storeCoord.toggleEntity}
      onExpand={openDetailDrawer}
      onToggleTierExpand={toggleTierStructureExpand}
    />
  </div>

  <!-- Earnings + Rewards Sections -->
  <PointsSection
    {entities}
    cardDefinitions={entities.cardDefinitions}
    loading={paginationStore.loading}
    hasMore={paginationStore.hasMore}
    loadingMore={paginationStore.loadingMore}
    cursorCountdown={paginationStore.cursorCountdown}
    entityUsage={storeCoord.entityUsage}
    {shakeCard}
    {removingCard}
    assignmentActive={storeCoord.assignmentActive}
    isEntityAssigned={storeCoord.isEntityAssigned}
    toggleEntityAssignment={storeCoord.toggleEntityAssignment}
    setRewardStock={storeCoord.setRewardStock}
    pendingChanges={storeCoord.pendingChanges}
    selection={storeCoord.selection}
    earningRuleCards={storeCoord.earningRuleCards}
    getClasses={entityClasses}
    getAssignedEntityIds={storeCoord.getAssignedEntityIds}
    getRewardCardDefinitions={storeCoord.getRewardCardDefinitions}
    onCreate={openCreateModal}
    onStatusChange={changeEntityStatus}
    onSelect={storeCoord.toggleEntity}
    onLoadMore={loadMore}
    onRefresh={refreshEntity}
    onExpand={openDetailDrawer}
  />
</div>

{#if storeCoord.tierStructureAssignPopover}
  <TierStructureAssignPopover
    cardDefId={storeCoord.tierStructureAssignPopover.cardDefId}
    cardName={storeCoord.tierStructureAssignPopover.cardName}
    tierStructures={storeCoord.tierStructureAssignPopover.options}
    onApply={storeCoord.applyTierStructureAssignPopover}
    onCancel={storeCoord.cancelTierStructureAssignPopover}
  />
{/if}

<AssignmentSaveBar
  active={storeCoord.assignmentActive}
  hasPendingChanges={storeCoord.hasPendingChanges}
  pendingChanges={storeCoord.pendingChanges}
  onSave={saveAllAssignments}
  onDiscard={storeCoord.cancelAllAssignments}
/>

<CreateEntityDrawer
  open={createModal.open}
  entityType={createModal.entityType || ""}
  entityLabel={createModal.entityType ? entityLabels[createModal.entityType] : ""}
  samplePayload={createModal.entityType
    ? JSON.stringify({ ...samplePayloads[createModal.entityType], ...(createModal.prefillData || {}) }, null, 2)
    : ""}
  createEndpoint={createModal.entityType === "tiers" && createModal.prefillData?.tierStructureId
    ? endpoints.tierStructures.tiers.create(createModal.prefillData.tierStructureId)
    : createModal.entityType
    ? endpoints[createModal.entityType].create()
    : ""}
  cardDefinitions={entities.cardDefinitions || []}
  benefits={entities.benefits || []}
  tierStructures={entities.tierStructures || []}
  onClose={closeCreateModal}
  onCreated={() => {
    if (createModal.entityType === "tiers" && createModal.prefillData?.tierStructureId) {
      refreshTiers(createModal.prefillData.tierStructureId);
    } else {
      refreshEntity(createModal.entityType);
    }
  }}
/>

<EntityDrawer
  open={entityDrawer.open}
  activeTab={entityDrawer.activeTab}
  entityType={entityDrawer.entityType || ""}
  entityLabel={entityDrawer.entityType ? entityLabels[entityDrawer.entityType] || entityDrawer.entityType : ""}
  entityId={entityDrawer.entityId || ""}
  item={entityDrawer.item}
  entityData={entityDrawer.entityData}
  updateEndpoint={entityDrawer.updateEndpoint}
  activitiesEndpoint={entityDrawer.activitiesEndpoint}
  prefillData={entityDrawer.prefillData || {}}
  {programs}
  earningRuleBenefits={storeCoord.earningRuleBenefits}
  earningRuleCards={storeCoord.earningRuleCards}
  tierStructureCards={storeCoord.tierStructureCards}
  {entities}
  onClose={closeEntityDrawer}
  onUpdated={() => {
    if (entityDrawer.prefillData?.tierStructureId) {
      refreshTiers(entityDrawer.prefillData.tierStructureId);
    } else {
      refreshEntity(entityDrawer.entityType);
    }
  }}
  onDelete={async (entityType, id) => {
    if (entityType === "tiers" && entityDrawer.prefillData?.tierStructureId) {
      await deleteTier(entityDrawer.prefillData.tierStructureId, id);
    } else {
      await deleteEntity(entityType, id);
    }
  }}
  onStatusChange={async (entityType, id, action, toStatus) => {
    await changeEntityStatus(entityType, id, action, toStatus);
    openDetailDrawer(entityType, id);
  }}
  onNavigate={openDetailDrawer}
/>
