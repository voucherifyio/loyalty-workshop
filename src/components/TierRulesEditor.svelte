<script>
  import { SvelteSet } from 'svelte/reactivity';
  import * as tierLoaderService from '../services/tierLoaderService.js';
  import CountBadge from './shared/CountBadge.svelte';

  let {
    initialTierRules = { type: 'NO_REQUIREMENTS', any_of: [] },
    availableTierStructures = [],
    onSave = () => {},
    onCancel = () => {},
  } = $props();

  // Initialize tier rules from props
  let initialized = $state(false);
  let tierRules = $state({ type: 'NO_REQUIREMENTS', any_of: [] });
  
  // Cache for tiers by tier structure
  let tiersCache = $state({});
  let loadingTiers = $state(new SvelteSet());

  // Initialize once when component mounts
  $effect(() => {
    if (!initialized) {
      tierRules = JSON.parse(JSON.stringify(initialTierRules)); // Deep clone
      // Ensure any_of is always an array
      if (!tierRules.any_of) {
        tierRules.any_of = [];
      }
      initialized = true;
      
      // Pre-load tiers for any existing tier structure IDs
      if (tierRules.type === 'ANY_OF' && tierRules.any_of?.length > 0) {
        tierRules.any_of.forEach((entry) => {
          if (entry.tier_structure_id && !tiersCache[entry.tier_structure_id]) {
            loadTiers(entry.tier_structure_id);
          }
        });
      }
    }
  });

  function updateType(newType) {
    tierRules.type = newType;
    if (newType === 'NO_REQUIREMENTS') {
      tierRules.any_of = [];
    } else if (newType === 'ANY_OF') {
      // Ensure any_of is an array
      if (!tierRules.any_of) {
        tierRules.any_of = [];
      }
      // Start with one empty entry if none exist
      if (tierRules.any_of.length === 0) {
        addAnyOfEntry();
      }
    }
  }

  function addAnyOfEntry() {
    // Ensure any_of exists
    if (!tierRules.any_of) {
      tierRules.any_of = [];
    }
    tierRules.any_of = [...tierRules.any_of, { tier_structure_id: '', tier_ids: [] }];
  }

  function removeAnyOfEntry(index) {
    tierRules.any_of = tierRules.any_of.filter((_, i) => i !== index);
  }

  async function loadTiers(tierStructureId) {
    if (tierLoaderService.isLoading(tierStructureId) || tiersCache[tierStructureId]) {
      return;
    }

    loadingTiers = new SvelteSet([...loadingTiers, tierStructureId]);
    
    const tiers = await tierLoaderService.loadTiers(tierStructureId);
    if (tiers !== null) {
      tiersCache = { ...tiersCache, [tierStructureId]: tiers };
    }

    const newLoading = new SvelteSet(loadingTiers);
    newLoading.delete(tierStructureId);
    loadingTiers = newLoading;
  }

  function updateTierStructure(index, tierStructureId) {
    tierRules.any_of[index].tier_structure_id = tierStructureId;
    tierRules.any_of[index].tier_ids = [];
    
    // Load tiers for this structure if not already cached
    if (tierStructureId && !tiersCache[tierStructureId]) {
      loadTiers(tierStructureId);
    }
  }

  function toggleTier(entryIndex, tierId) {
    const entry = tierRules.any_of[entryIndex];
    const currentIds = entry.tier_ids || [];
    
    if (currentIds.includes(tierId)) {
      entry.tier_ids = currentIds.filter(id => id !== tierId);
    } else {
      entry.tier_ids = [...currentIds, tierId];
    }
    
    // Trigger reactivity
    tierRules.any_of = [...tierRules.any_of];
  }

  // Validation
  const isValid = $derived(() => {
    if (tierRules.type === 'NO_REQUIREMENTS') return true;
    
    if (tierRules.type === 'ANY_OF') {
      if (!tierRules.any_of || tierRules.any_of.length === 0) return false;
      
      return tierRules.any_of.every(entry => 
        entry.tier_structure_id && 
        entry.tier_ids && 
        entry.tier_ids.length > 0
      );
    }
    
    return false;
  });

  function handleSave() {
    if (!isValid) return;
    onSave(tierRules);
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel();
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  aria-label="Tier rules configuration"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === "Escape" && onCancel()}
  tabindex="-1"
>
  <div
    class="card bg-base-100 shadow-2xl w-[700px] max-w-full max-h-[80vh] flex flex-col"
  >
    <div class="card-body p-5 space-y-4 flex flex-col overflow-hidden">
      <div>
        <h3 class="font-bold text-base">Configure Tier Rules</h3>
        <p class="text-xs text-base-content/50 mt-0.5">
          Define tier membership requirements that must be met for this configuration to apply.
        </p>
      </div>

      <!-- Type selector -->
      <div class="space-y-2">
        <label class="text-xs font-semibold text-base-content/70">Rule Type</label>
        <div class="flex gap-4">
          <label class="cursor-pointer flex items-center gap-2">
            <input
              type="radio"
              name="tier-rule-type"
              class="radio radio-sm radio-primary"
              checked={tierRules.type === 'NO_REQUIREMENTS'}
              onchange={() => updateType('NO_REQUIREMENTS')}
            />
            <span class="text-sm">No Requirements</span>
          </label>
          <label class="cursor-pointer flex items-center gap-2">
            <input
              type="radio"
              name="tier-rule-type"
              class="radio radio-sm radio-primary"
              checked={tierRules.type === 'ANY_OF'}
              onchange={() => updateType('ANY_OF')}
            />
            <span class="text-sm">Any Of (Member must belong to at least one)</span>
          </label>
        </div>
      </div>

      <!-- ANY_OF configuration -->
      {#if tierRules.type === 'ANY_OF'}
        <div class="flex-1 overflow-y-auto space-y-3 min-h-0">
          {#if tierRules.any_of.length === 0}
            <div class="text-center py-8 text-base-content/50">
              <p class="text-sm">No tier combinations configured</p>
              <p class="text-xs mt-1">
                Click "Add Tier Combination" to create a new requirement
              </p>
            </div>
          {:else}
            {#each tierRules.any_of as entry, index (index)}
              {@const tierStructureId = entry.tier_structure_id}
              {@const tiers = tiersCache[tierStructureId] || []}
              {@const isLoadingTiers = loadingTiers.has(tierStructureId)}
              {@const tierStructure = availableTierStructures.find(ts => ts.id === tierStructureId)}
              
              <div class="card bg-base-200 border border-base-300">
                <div class="card-body p-3 space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <div class="text-xs font-semibold text-base-content/70">
                      Combination {index + 1}
                    </div>
                    <button
                      type="button"
                      class="btn btn-xs btn-ghost btn-circle"
                      onclick={() => removeAnyOfEntry(index)}
                      title="Remove combination"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <!-- Tier Structure selector -->
                  <div class="space-y-1">
                    <label for="tier-structure-{index}" class="text-xs font-medium text-base-content/70">
                      Tier Structure
                    </label>
                    <select
                      id="tier-structure-{index}"
                      class="select select-sm select-bordered w-full font-mono text-xs"
                      value={entry.tier_structure_id}
                      onchange={(e) => updateTierStructure(index, e.target.value)}
                    >
                      <option value="">Select tier structure...</option>
                      {#each availableTierStructures as ts (ts.id)}
                        <option value={ts.id}>{ts.name || ts.id}</option>
                      {/each}
                    </select>
                  </div>

                  <!-- Tiers multi-select -->
                  {#if tierStructureId}
                    <div class="space-y-1">
                      <div class="text-xs font-medium text-base-content/70">
                        Tiers
                        {#if entry.tier_ids?.length > 0}
                          <CountBadge count={entry.tier_ids.length} label="selected" className="ml-1" />
                        {/if}
                      </div>
                      
                      {#if isLoadingTiers}
                        <div class="flex items-center gap-2 text-xs text-base-content/50 py-2">
                          <span class="loading loading-spinner loading-xs"></span>
                          Loading tiers...
                        </div>
                      {:else if tiers.length === 0}
                        <div class="text-xs text-base-content/50 py-2">
                          No tiers found for this tier structure
                        </div>
                      {:else}
                        <div class="space-y-1 pl-1">
                          {#each tiers as tier (tier.id)}
                            <label class="flex items-center gap-2 cursor-pointer hover:bg-base-300/50 p-1 rounded">
                              <input
                                type="checkbox"
                                class="checkbox checkbox-xs checkbox-primary"
                                checked={entry.tier_ids?.includes(tier.id)}
                                onchange={() => toggleTier(index, tier.id)}
                              />
                              <span class="text-xs font-mono flex-1">
                                {tier.name || tier.id}
                              </span>
                            </label>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <!-- Add button -->
        <div class="pt-2 border-t border-base-300">
          <button
            type="button"
            class="btn btn-sm btn-outline w-full"
            onclick={addAnyOfEntry}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Tier Combination
          </button>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex gap-2 justify-end pt-2 border-t border-base-300">
        <button type="button" class="btn btn-sm btn-ghost" onclick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-sm btn-primary"
          onclick={handleSave}
          disabled={!isValid}
        >
          Save
        </button>
      </div>
    </div>
  </div>
</div>
