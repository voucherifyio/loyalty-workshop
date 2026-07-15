<script>
  import FieldValueList from "./FieldValueList.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import EntityActionBar from "./entity/EntityActionBar.svelte";
  import EntityActivitiesTab from "./entity/EntityActivitiesTab.svelte";
  import EntityLinkedTab from "./entity/EntityLinkedTab.svelte";
  import EntityEditTab from "./entity/EntityEditTab.svelte";
  import JsonDisplay from "./shared/JsonDisplay.svelte";

  let {
    open = false,
    activeTab = "details",   // 'details' | 'edit' | 'activities' | 'usedBy' | 'json'
    entityType = "",
    entityLabel = "",
    entityId = "",
    item = null,
    entityData = {},
    updateEndpoint = "",
    activitiesEndpoint = "",
    prefillData = {},
    // Relationship data for Linked tab
    programs = [],
    earningRuleBenefits = {},
    earningRuleCards = {},
    tierStructureCards = {},
    entities = {},
    onClose = () => {},
    onUpdated = () => {},
    onDelete = () => {},
    onStatusChange = () => {},
    onNavigate = () => {},
  } = $props();

  // Local tab state - sync with activeTab prop
  let currentTab = $state(activeTab);

  // Derive parent tier structure status if editing a tier
  const parentTierStructureStatus = $derived.by(() => {
    if (entityType !== 'tiers' || !prefillData?.tierStructureId) return null;
    
    const tierStructure = entities.tierStructures?.find(
      ts => ts.id === prefillData.tierStructureId
    );
    
    return tierStructure?.status || null;
  });

  // Sync currentTab when prop changes
  $effect(() => {
    if (open) currentTab = activeTab;
  });

  function handleClose() {
    onClose();
  }

  function handleKeydown(e) {
    if (e.key === "Escape" && open) handleClose();
  }

  const displayName = $derived(item?.name || item?.id || entityId || "");
  const displayId = $derived(item?.id || entityId || "");
  const displayStatus = $derived(item?.status ?? null);

  function getAvailableStatusTransitions(type, currentStatus) {
    if (type === 'benefits') {
      if (currentStatus === 'DRAFT') return [{ action: 'activate', toStatus: 'ACTIVE', label: 'Activate' }];
      if (currentStatus === 'ACTIVE') return [{ action: 'draft', toStatus: 'DRAFT', label: 'Move to Draft' }];
      return [];
    }
    if (currentStatus === 'DRAFT') {
      return [{ action: 'activate', toStatus: 'ACTIVE', label: 'Activate' }];
    }
    if (currentStatus === 'ACTIVE') {
      return [
        { action: 'deactivate', toStatus: 'INACTIVE', label: 'Deactivate' },
        { action: 'draft', toStatus: 'DRAFT', label: 'Move to Draft' },
      ];
    }
    if (currentStatus === 'INACTIVE') {
      return [{ action: 'activate', toStatus: 'ACTIVE', label: 'Activate' }];
    }
    return [];
  }

  const drawerTransitions = $derived(getAvailableStatusTransitions(entityType, displayStatus));

  // Compute "Used By" groups
  const usedByGroups = $derived.by(() => {
    if (!entityType || !entityId) return [];
    const groups = [];

    function programsUsing(idField) {
      return programs
        .filter(p => p.assignedEntities?.[idField]?.some(e => (e[idField.replace(/s$/, '_id')] || e[`${idField.slice(0, -1)}_id`] || e.id) === entityId))
        .map(p => ({ id: p.id, name: p.name, status: p.status }));
    }

    if (entityType === "cardDefinitions") {
      const assignedPrograms = programs
        .filter(p => p.assignedEntities?.cardDefinitions?.some(e => (e.card_definition_id || e.id) === entityId))
        .map(p => ({ id: p.id, name: p.name, status: p.status }));
      if (assignedPrograms.length) groups.push({ type: "programs", label: "Programs", items: assignedPrograms });

      const usingEarningRuleIds = Object.entries(earningRuleCards)
        .filter(([, cardIds]) => cardIds.includes(entityId))
        .map(([ruleId]) => ruleId);
      const usingEarningRules = usingEarningRuleIds
        .map(id => (entities.earningRules || []).find(e => e.id === id))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, status: e.status }));
      if (usingEarningRules.length) groups.push({ type: "earningRules", label: "Earning Rules", items: usingEarningRules });

      const usingTierStructureIds = Object.entries(tierStructureCards)
        .filter(([, cardId]) => cardId === entityId)
        .map(([tsId]) => tsId);
      const usingTierStructures = usingTierStructureIds
        .map(id => (entities.tierStructures || []).find(e => e.id === id))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, status: e.status }));
      if (usingTierStructures.length) groups.push({ type: "tierStructures", label: "Tier Structures", items: usingTierStructures });

    } else if (entityType === "earningRules") {
      const assignedPrograms = programs
        .filter(p => p.assignedEntities?.earningRules?.some(e => (e.earning_rule_id || e.id) === entityId))
        .map(p => ({ id: p.id, name: p.name, status: p.status }));
      if (assignedPrograms.length) groups.push({ type: "programs", label: "Programs", items: assignedPrograms });

    } else if (entityType === "benefits") {
      const usingEarningRuleIds = Object.entries(earningRuleBenefits)
        .filter(([, benefits]) => benefits.some(benefit => (benefit.benefit_id || benefit.id) === entityId))
        .map(([ruleId]) => ruleId);
      const usingEarningRules = usingEarningRuleIds
        .map(id => (entities.earningRules || []).find(e => e.id === id))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, status: e.status }));
      if (usingEarningRules.length) groups.push({ type: "earningRules", label: "Earning Rules", items: usingEarningRules });

    } else if (entityType === "rewards") {
      const assignedPrograms = programs
        .filter(p => p.assignedEntities?.rewards?.some(e => (e.reward_id || e.id) === entityId))
        .map(p => ({ id: p.id, name: p.name, status: p.status }));
      if (assignedPrograms.length) groups.push({ type: "programs", label: "Programs", items: assignedPrograms });

    } else if (entityType === "tierStructures") {
      const assignedPrograms = programs
        .filter(p => p.assignedEntities?.tierStructures?.some(e => (e.tier_structure_id || e.id) === entityId))
        .map(p => ({ id: p.id, name: p.name, status: p.status }));
      if (assignedPrograms.length) groups.push({ type: "programs", label: "Programs", items: assignedPrograms });

      const cardDefId = tierStructureCards[entityId];
      if (cardDefId) {
        const cardDef = (entities.cardDefinitions || []).find(e => e.id === cardDefId);
        if (cardDef) groups.push({ type: "cardDefinitions", label: "Card Definitions", items: [{ id: cardDef.id, name: cardDef.name, status: cardDef.status }] });
      }
    }

    return groups;
  });

  // Compute "Uses" groups
  const usesGroups = $derived.by(() => {
    if (!entityType || !entityId) return [];
    const groups = [];

    if (entityType === "earningRules") {
      const benefitIds = (earningRuleBenefits[entityId] || []).map(benefit => benefit.benefit_id || benefit.id);
      const usedBenefits = benefitIds
        .map(id => (entities.benefits || []).find(e => e.id === id))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, status: e.status }));
      if (usedBenefits.length) groups.push({ type: "benefits", label: "Benefits", items: usedBenefits });

      const cardIds = earningRuleCards[entityId] || [];
      const usedCards = cardIds
        .map(id => (entities.cardDefinitions || []).find(e => e.id === id))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, status: e.status }));
      if (usedCards.length) groups.push({ type: "cardDefinitions", label: "Card Definitions", items: usedCards });

    } else if (entityType === "tierStructures") {
      const cardDefId = tierStructureCards[entityId];
      if (cardDefId) {
        const cardDef = (entities.cardDefinitions || []).find(e => e.id === cardDefId);
        if (cardDef) groups.push({ type: "cardDefinitions", label: "Card Definitions", items: [{ id: cardDef.id, name: cardDef.name, status: cardDef.status }] });
      }

    } else if (entityType === "programs" && item) {
      const assigned = item.assignedEntities || {};

      const cardDefs = (assigned.cardDefinitions || [])
        .map(a => (entities.cardDefinitions || []).find(e => e.id === (a.card_definition_id || a.id)))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, status: e.status }));
      if (cardDefs.length) groups.push({ type: "cardDefinitions", label: "Card Definitions", items: cardDefs });

      const earningRulesList = (assigned.earningRules || [])
        .map(a => (entities.earningRules || []).find(e => e.id === (a.earning_rule_id || a.id)))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, status: e.status }));
      if (earningRulesList.length) groups.push({ type: "earningRules", label: "Earning Rules", items: earningRulesList });

      const rewardsList = (assigned.rewards || [])
        .map(a => (entities.rewards || []).find(e => e.id === (a.reward_id || a.id)))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, status: e.status }));
      if (rewardsList.length) groups.push({ type: "rewards", label: "Rewards", items: rewardsList });

      const tierStructuresList = (assigned.tierStructures || [])
        .map(a => (entities.tierStructures || []).find(e => e.id === (a.tier_structure_id || a.id)))
        .filter(Boolean)
        .map(e => ({ id: e.id, name: e.name, status: e.status }));
      if (tierStructuresList.length) groups.push({ type: "tierStructures", label: "Tier Structures", items: tierStructuresList });
    }

    return groups;
  });

  const linkedCount = $derived(
    usedByGroups.reduce((acc, g) => acc + g.items.length, 0) +
    usesGroups.reduce((acc, g) => acc + g.items.length, 0)
  );

  // Strip augmented properties to show only raw API data in JSON tab
  const rawApiData = $derived.by(() => {
    if (!item) return null;
    const { assignedEntities, assignments, membersCount, ...apiData } = item;
    return apiData;
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
{#if open}
  <div class="fixed inset-0 bg-black/20 z-40" onclick={handleClose} role="presentation"></div>
{/if}

<!-- Drawer Panel -->
<div
  class="fixed top-0 right-0 h-full w-[650px] bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out {open ? 'translate-x-0' : 'translate-x-full'} flex flex-col"
>
  <!-- Header -->
  <div class="flex items-start justify-between p-4 border-b border-base-300 shrink-0">
    <div class="flex-1 min-w-0 pr-2">
      <p class="text-xs text-base-content/50 font-medium uppercase tracking-wide mb-1">
        {entityLabel}
      </p>
      <h3 class="font-bold text-lg leading-tight truncate">{displayName}</h3>
      {#if displayId && displayId !== displayName}
        <p class="text-xs font-mono text-base-content/50 truncate mt-0.5">{displayId}</p>
      {/if}
      {#if displayStatus}
        <div class="mt-2"><StatusBadge status={displayStatus} /></div>
      {/if}
    </div>
    <div class="flex items-center gap-1 shrink-0">
      <button class="btn btn-sm btn-circle btn-ghost" onclick={handleClose} aria-label="Close drawer">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Action Bar -->
  <EntityActionBar
    {displayId}
    transitions={drawerTransitions}
    {entityType}
    {onStatusChange}
    {onDelete}
    onSwitchToEdit={() => (currentTab = "edit")}
  />

  <!-- Tabs -->
  <div role="tablist" class="tabs tabs-bordered px-4 shrink-0 border-b border-base-300">
    <button role="tab" class="tab {currentTab === 'details' ? 'tab-active' : ''}" onclick={() => (currentTab = "details")}>Details</button>
    <button role="tab" class="tab {currentTab === 'edit' ? 'tab-active' : ''}" onclick={() => (currentTab = "edit")}>Edit</button>
    <button role="tab" class="tab {currentTab === 'activities' ? 'tab-active' : ''}" onclick={() => (currentTab = "activities")}>Activities</button>
    <button role="tab" class="tab {currentTab === 'usedBy' ? 'tab-active' : ''}" onclick={() => (currentTab = "usedBy")}>
      Linked
      {#if linkedCount > 0}
        <span class="badge badge-sm badge-primary ml-1">{linkedCount}</span>
      {/if}
    </button>
    <button role="tab" class="tab {currentTab === 'json' ? 'tab-active' : ''}" onclick={() => (currentTab = "json")}>JSON</button>
  </div>

  <!-- Tab content -->
  {#if currentTab === "details"}
    <div class="flex-1 overflow-y-auto p-4">
      {#if item}
        <FieldValueList {item} {entityType} cardDefinitions={entities.cardDefinitions || []} />
      {:else}
        <p class="text-sm text-base-content/50 text-center py-8">No details available</p>
      {/if}
    </div>

  {:else if currentTab === "activities"}
    <EntityActivitiesTab {open} {entityId} {activitiesEndpoint} />

  {:else if currentTab === "usedBy"}
    <EntityLinkedTab {usedByGroups} {usesGroups} {onNavigate} />

  {:else if currentTab === "edit"}
    <EntityEditTab
      {open}
      {entityType}
      {entityId}
      {entityData}
      {updateEndpoint}
      {entityLabel}
      parentStatus={parentTierStructureStatus}
      cardDefinitions={entities.cardDefinitions || []}
      benefits={entities.benefits || []}
      tierStructures={entities.tierStructures || []}
      onUpdated={onUpdated}
      onClose={handleClose}
    />

  {:else if currentTab === "json"}
    <div class="flex-1 overflow-y-auto p-4">
      {#if rawApiData}
        <div class="text-xs text-base-content/60 mb-3">
          Raw API response (augmented UI properties removed)
        </div>
        <pre class="bg-base-200 rounded-lg p-4 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">{JSON.stringify(rawApiData, null, 2)}</pre>
      {:else}
        <p class="text-sm text-base-content/50 text-center py-8">No data available</p>
      {/if}
    </div>
  {/if}
</div>
