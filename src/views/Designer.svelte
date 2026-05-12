<script>
  import { untrack } from "svelte";
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import CreateEntityDrawer from "../components/CreateEntityDrawer.svelte";
  import EntityDrawer from "../components/EntityDrawer.svelte";
  import AssignmentSaveBar from "../components/AssignmentSaveBar.svelte";
  import PointsSection from "../components/PointsSection.svelte";
  import WalletsSection from "../components/WalletsSection.svelte";
  import ProgramsSection from "../components/ProgramsSection.svelte";
  import MembersDrawer from "../components/MembersDrawer.svelte";
  import TierStructureAssignPopover from "../components/TierStructureAssignPopover.svelte";
  import {
    samplePayloads,
    entityLabels,
  } from "../config/designerConfig.js";
  import { getTierStructureCardDefId } from "../utils/entityRelationships.js";
  import { getProgramClasses, getEntityClasses } from "../utils/entityStyles.js";
  import { getEntityEndpoints } from "../utils/entityCrud.js";
  import { toast } from "../services/toast.js";
  import { selectionStore } from "../stores/designer/selection.svelte.js";
  import { paginationStore } from "../stores/designer/pagination.svelte.js";
  import { assignmentStore } from "../stores/designer/assignment.svelte.js";
  import { relationshipsStore } from "../stores/designer/relationships.svelte.js";

  // ── Core data state ──────────────────────────────────────────────────────
  let programs = $state([]);
  let entities = $state({
    cardDefinitions: [],
    earningRules: [],
    incentives: [],
    rewards: [],
    tierStructures: [],
  });

  // ── UI-only state ─────────────────────────────────────────────────────────
  let entityDrawer = $state({
    open: false, activeTab: "details", entityType: null, entityId: null,
    item: null, entityData: {}, updateEndpoint: "", activitiesEndpoint: "", prefillData: null,
  });
  let membersDrawer = $state({ open: false, programId: null, programName: '' });
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
    assignmentStore.resetForSelection(id, type, untrack(() => programs));
  });

  // Initial data load + countdown interval
  $effect(() => {
    loadData();
    const interval = setInterval(() => paginationStore.updateCountdowns(), 1000);
    return () => clearInterval(interval);
  });

  // Expose actions to TopBar via parent binding
  let { designerActions = $bindable(null) } = $props();
  $effect(() => {
    designerActions = {
      fetchAll: loadData,
      loadEverything,
      get loading() { return paginationStore.loading; },
      get loadingAll() { return paginationStore.loadingAll; },
    };
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
      relationshipsStore.refreshCardRelationships(entities.earningRules, entities.tierStructures);
    }
    if (entityType === 'incentives') {
      relationshipsStore.refreshIncentiveCards(entities.incentives);
    }
  }

  // ── CRUD operations ───────────────────────────────────────────────────────
  async function changeEntityStatus(entityType, id, action, toStatus) {
    changingStatus = { type: entityType, id, action };
    try {
      await api.post(getEntityEndpoints(entityType)[action](id));
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
      await api.delete(getEntityEndpoints(entityType).delete(id));
      removingCard = { type: entityType, id };
      setTimeout(() => {
        if (entityType === "programs") {
          programs = programs.filter((p) => p.id !== id);
        } else {
          entities[entityType] = entities[entityType].filter((e) => e.id !== id);
        }
        relationshipsStore.refreshUsage(programs);
        if (entityType === "earningRules") {
          relationshipsStore.removeEarningRule(id);
        }
        if (["cardDefinitions", "earningRules", "tierStructures"].includes(entityType)) {
          relationshipsStore.refreshCardRelationships(entities.earningRules, entities.tierStructures);
        }
        removingCard = null;
        if (
          (entityType === "programs" && selectionStore.selection?.type === "program" && selectionStore.selection.id === id) ||
          (selectionStore.selection?.type === "entity" && selectionStore.selection.category === entityType && selectionStore.selection.id === id)
        ) {
          selectionStore.clear();
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
    return (entities[entityType] || []).find((e) => e.id === id) || null;
  }

  function openDetailDrawer(entityType, id) {
    const item = findEntityById(entityType, id);
    if (!item) return;
    entityDrawer = {
      open: true, activeTab: "details", entityType, entityId: id, item,
      entityData: {},
      updateEndpoint: endpoints[entityType]?.update?.(id) || "",
      activitiesEndpoint: endpoints[entityType]?.activities?.(id) || "",
      prefillData: null,
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

  async function openEditTier(tierStructureId, tierId) {
    try {
      const data = await api.get(endpoints.tierStructures.tiers.get(tierStructureId, tierId));
      entityDrawer = {
        open: true, activeTab: "edit", entityType: "tiers", entityId: tierId,
        item: findEntityById("tierStructures", tierStructureId) || null,
        entityData: data || {},
        updateEndpoint: endpoints.tierStructures.tiers.update(tierStructureId, tierId),
        activitiesEndpoint: "",
        prefillData: { tierStructureId },
      };
    } catch {
      toast.error('Failed to load tier for editing');
    }
  }

  async function deleteTier(tierStructureId, tierId) {
    try {
      await api.delete(endpoints.tierStructures.tiers.delete(tierStructureId, tierId));
      const response = await api.get(endpoints.tierStructures.tiers.list(tierStructureId));
      expandedTierStructures = { ...expandedTierStructures, [tierStructureId]: response.data || [] };
      toast.success('Tier deleted successfully');
    } catch (err) {
      toast.error('Failed to delete tier');
      throw err;
    }
  }

  async function toggleTierStructureExpand(tierStructureId) {
    if (expandedTierStructures[tierStructureId]) {
      const { [tierStructureId]: _, ...rest } = expandedTierStructures;
      expandedTierStructures = rest;
    } else {
      try {
        const response = await api.get(endpoints.tierStructures.tiers.list(tierStructureId));
        expandedTierStructures = { ...expandedTierStructures, [tierStructureId]: response.data || [] };
      } catch {
        toast.error('Failed to load tiers');
      }
    }
  }

  function showMembers(programId, programName) {
    membersDrawer = { open: true, programId, programName };
  }

  function refreshProgramMemberCount(programId) {
    const idx = programs.findIndex((p) => p.id === programId);
    if (idx === -1) return;
    api.get(endpoints.members.list(programId, { limit: 1 }))
      .then((res) => {
        const count = res.data?.length > 0 ? (res.cursor ? '1+' : res.data.length) : 0;
        programs = programs.map((p, i) => i === idx ? { ...p, membersCount: count } : p);
      })
      .catch(() => {});
  }

  function openCreateModal(entityType) {
    createModal = { open: true, entityType, prefillData: null };
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
    if (entityType === "incentives") {
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
      entityType, entity, selectionStore.selection, removingCard, shakeCard,
      relationshipsStore.earningRuleCards, relationshipsStore.tierStructureCards,
      relationshipsStore.earningRuleIncentives, relationshipsStore.incentiveCards, programs
    );
  }
  function programClasses(program) {
    return getProgramClasses(
      program, selectionStore.selection, removingCard, shakeCard,
      relationshipsStore.earningRuleIncentives, programs
    );
  }

  // ── Assignment wrappers (pass runtime state to store methods) ─────────────
  const sel = () => selectionStore.selection;
  function isEntityAssigned(entityType, id) {
    return assignmentStore.isEntityAssigned(entityType, id, sel(), programs);
  }
  function toggleEntityAssignment(entityType, id) {
    assignmentStore.toggleEntityAssignment(entityType, id, sel(), programs);
  }
  function toggleTierStructureAssignment(id) {
    assignmentStore.toggleTierStructureAssignment(id, sel(), programs, entities);
  }
  function handleCardDefinitionAssignmentToggle(cardDefId) {
    assignmentStore.handleCardDefinitionToggle(cardDefId, entities, sel(), programs);
  }
  function getAssignedEntityIds(entityType) {
    return assignmentStore.getAssignedEntityIds(entityType, sel(), programs);
  }
  function getRewardCardDefinitions() {
    return assignmentStore.getRewardCardDefinitions(sel(), programs, entities);
  }
  function setRewardCost(rewardId, costData) {
    assignmentStore.setRewardCost(rewardId, costData);
  }
  async function saveAllAssignments() {
    await assignmentStore.saveAllAssignments(sel(), programs);
    programs = [...programs]; // Trigger reactivity after in-place mutations
  }
  function cancelAllAssignments() {
    assignmentStore.cancelAllAssignments();
  }
  function cancelTierStructureAssignPopover() {
    assignmentStore.cancelTierStructureAssignPopover(sel(), programs);
  }
  function applyTierStructureAssignPopover(tierStructureId) {
    assignmentStore.applyTierStructureAssignPopover(tierStructureId, sel(), programs, entities);
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
      getClasses={programClasses}
      {getAvailableStatusTransitions}
      onCreate={openCreateModal}
      onEdit={openEditModal}
      onSelect={(id) => selectionStore.toggleProgram(id)}
      onStartDelete={startDelete}
      onCancelDelete={cancelDelete}
      onDelete={deleteEntity}
      onStartStatusChange={startStatusChange}
      onCancelStatusChange={cancelStatusChange}
      onStatusChange={changeEntityStatus}
      onExpand={openDetailDrawer}
      onLoadMore={() => loadMore("programs")}
      onRefresh={() => refreshEntity("programs")}
      onHoverChange={(value) => { hoveredCard = value; }}
      onShowMembers={showMembers}
    />
  </div>

  <!-- Wallets Section -->
  <div class="bg-base-200/50 rounded-xl p-5 space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Wallets</p>
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
      entityUsage={relationshipsStore.entityUsage}
      {shakeCard}
      {removingCard}
      assignmentActive={selectionStore.assignmentActive}
      {isEntityAssigned}
      {toggleTierStructureAssignment}
      {toggleEntityAssignment}
      onToggleCardDefinitionAssignment={handleCardDefinitionAssignmentToggle}
      selection={selectionStore.selection}
      getClasses={entityClasses}
      onCreate={openCreateModal}
      onCreateTierForCardDef={openCreateTierForCardDef}
      onCreateTier={openCreateTier}
      onEdit={openEditModal}
      onEditTier={openEditTier}
      onDelete={deleteEntity}
      onDeleteTier={deleteTier}
      onStatusChange={changeEntityStatus}
      onSelect={(cat, id) => selectionStore.toggleEntity(cat, id)}
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
    entityUsage={relationshipsStore.entityUsage}
    {shakeCard}
    {removingCard}
    assignmentActive={selectionStore.assignmentActive}
    {isEntityAssigned}
    {toggleEntityAssignment}
    {setRewardCost}
    pendingChanges={assignmentStore.pendingChanges}
    selection={selectionStore.selection}
    earningRuleCards={relationshipsStore.earningRuleCards}
    getClasses={entityClasses}
    {getAssignedEntityIds}
    {getRewardCardDefinitions}
    onCreate={openCreateModal}
    onStatusChange={changeEntityStatus}
    onSelect={(cat, id) => selectionStore.toggleEntity(cat, id)}
    onLoadMore={loadMore}
    onRefresh={refreshEntity}
    onExpand={openDetailDrawer}
  />
</div>

{#if assignmentStore.tierStructureAssignPopover}
  <TierStructureAssignPopover
    cardDefId={assignmentStore.tierStructureAssignPopover.cardDefId}
    cardName={assignmentStore.tierStructureAssignPopover.cardName}
    tierStructures={assignmentStore.tierStructureAssignPopover.options}
    onApply={applyTierStructureAssignPopover}
    onCancel={cancelTierStructureAssignPopover}
  />
{/if}

<AssignmentSaveBar
  active={selectionStore.assignmentActive && assignmentStore.hasPendingChanges}
  pendingChanges={assignmentStore.pendingChanges}
  onSave={saveAllAssignments}
  onDiscard={cancelAllAssignments}
/>

<MembersDrawer
  open={membersDrawer.open}
  programId={membersDrawer.programId}
  programName={membersDrawer.programName}
  onClose={() => { membersDrawer = { ...membersDrawer, open: false }; }}
  onMemberCountChange={() => refreshProgramMemberCount(membersDrawer.programId)}
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
  onClose={closeCreateModal}
  onCreated={() => {
    if (createModal.entityType === "tiers" && createModal.prefillData?.tierStructureId) {
      toggleTierStructureExpand(createModal.prefillData.tierStructureId);
      toggleTierStructureExpand(createModal.prefillData.tierStructureId);
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
  {programs}
  earningRuleIncentives={relationshipsStore.earningRuleIncentives}
  earningRuleCards={relationshipsStore.earningRuleCards}
  tierStructureCards={relationshipsStore.tierStructureCards}
  {entities}
  onClose={closeEntityDrawer}
  onUpdated={() => {
    if (entityDrawer.prefillData?.tierStructureId) {
      toggleTierStructureExpand(entityDrawer.prefillData.tierStructureId);
      toggleTierStructureExpand(entityDrawer.prefillData.tierStructureId);
    } else {
      refreshEntity(entityDrawer.entityType);
    }
  }}
  onDelete={deleteEntity}
  onStatusChange={async (entityType, id, action, toStatus) => {
    await changeEntityStatus(entityType, id, action, toStatus);
    openDetailDrawer(entityType, id);
  }}
  onNavigate={openDetailDrawer}
/>
