<script>
  import TierRulesEditor from './TierRulesEditor.svelte';

  let {
    initialCosts = [],
    availableCardDefinitions = [],
    availableTierStructures = [],
    onSave = () => {},
    onCancel = () => {},
  } = $props();

  // Initialize costs from props (only once)
  let initialized = $state(false);
  let costs = $state([]);

  // Track which cost items are expanded
  let expandedCosts = $state(new Set());

  // State for tier rules editor modal
  let tierRulesEditorOpen = $state(false);
  let tierRulesBeingEdited = $state(null);
  let tierRulesEditIndex = $state(null);

  // Initialize costs once when component mounts
  $effect(() => {
    if (!initialized && initialCosts.length > 0) {
      costs = JSON.parse(JSON.stringify(initialCosts)); // Deep clone
      // Ensure tier_rules has a default value if missing
      costs = costs.map(cost => ({
        ...cost,
        tier_rules: cost.tier_rules || { type: 'NO_REQUIREMENTS', any_of: [] }
      }));
      expandedCosts = new Set(costs.map((_, i) => i));
      initialized = true;
    }
  });

  function toggleExpand(index) {
    const newExpanded = new Set(expandedCosts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    expandedCosts = newExpanded;
  }

  function addCost() {
    const newCost = {
      rules: {},
      tier_rules: { type: 'NO_REQUIREMENTS', any_of: [] },
      spending: [
        {
          points: 0,
          card_definition_id: "",
        },
      ],
    };
    costs = [...costs, newCost];
    expandedCosts = new Set([...expandedCosts, costs.length - 1]);
  }

  function removeCost(index) {
    costs = costs.filter((_, i) => i !== index);
    // Update expanded indices
    const newExpanded = new Set();
    expandedCosts.forEach((i) => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    expandedCosts = newExpanded;
  }

  function updatePoints(index, value) {
    costs[index].spending[0].points = parseInt(value) || 0;
  }

  function updateCardDefinition(index, value) {
    costs[index].spending[0].card_definition_id = value;
  }

  // Validation
  const isValid = $derived(
    costs.length === 0 ||
      costs.every(
        (cost) =>
          cost.spending?.[0]?.points > 0 &&
          cost.spending?.[0]?.card_definition_id,
      ),
  );

  function handleSave() {
    if (!isValid) return;
    // Remove rules field from costs before saving (not needed yet, causes validation errors)
    // Keep tier_rules - it's a real field we want to send
    const costsToSave = costs.map(cost => {
      const { rules, ...costWithoutRules } = cost;
      return costWithoutRules;
    });
    onSave(costsToSave);
  }

  function openTierRulesEditor(index) {
    tierRulesEditIndex = index;
    tierRulesBeingEdited = JSON.parse(JSON.stringify(costs[index].tier_rules || { type: 'NO_REQUIREMENTS', any_of: [] }));
    tierRulesEditorOpen = true;
  }

  function closeTierRulesEditor() {
    tierRulesEditorOpen = false;
    tierRulesBeingEdited = null;
    tierRulesEditIndex = null;
  }

  function saveTierRules(tierRules) {
    if (tierRulesEditIndex !== null) {
      costs[tierRulesEditIndex].tier_rules = tierRules;
      // Trigger reactivity
      costs = [...costs];
    }
    closeTierRulesEditor();
  }

  function getTierRulesSummary(tierRules) {
    if (!tierRules || tierRules.type === 'NO_REQUIREMENTS') {
      return 'No requirements';
    }
    if (tierRules.type === 'ANY_OF') {
      const count = tierRules.any_of?.length || 0;
      return count > 0 ? `${count} tier combination${count !== 1 ? 's' : ''}` : 'No combinations';
    }
    return 'Unknown';
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel();
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  aria-label="Reward costs configuration"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === "Escape" && onCancel()}
  tabindex="-1"
>
  <div
    class="card bg-base-100 shadow-2xl w-[600px] max-w-full max-h-[80vh] flex flex-col"
  >
    <div class="card-body p-5 space-y-4 flex flex-col overflow-hidden">
      <div>
        <h3 class="font-bold text-base">Configure Reward Costs</h3>
        <p class="text-xs text-base-content/50 mt-0.5">
          Define one or more cost configurations. Each cost can have rules-based
          logic (coming soon).
        </p>
      </div>

      <!-- Costs list -->
      <div class="flex-1 overflow-y-auto space-y-3 min-h-0">
        {#if costs.length === 0}
          <div class="text-center py-8 text-base-content/50">
            <p class="text-sm">No costs configured</p>
            <p class="text-xs mt-1">
              Click "Add Cost" to create a new cost configuration
            </p>
          </div>
        {:else}
          {#each costs as cost, index (index)}
            {@const isExpanded = expandedCosts.has(index)}
            {@const spending = cost.spending?.[0] || {}}

            <div class="border border-base-300 rounded-lg overflow-hidden">
              <!-- Cost header -->
              <div class="w-full flex items-center justify-between p-3 bg-base-200/50">
                <button
                  class="flex items-center gap-2 text-left flex-1 min-w-0 hover:opacity-70 transition-opacity"
                  onclick={() => toggleExpand(index)}
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="w-4 h-4 transition-transform {isExpanded
                      ? 'rotate-90'
                      : ''}"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                  <span class="text-sm font-semibold">Cost {index + 1}</span>
                  {#if spending.points > 0 && spending.card_definition_id}
                    <span class="badge badge-xs badge-ghost font-mono">
                      {spending.points} pts
                    </span>
                  {/if}
                </button>
                <button
                  class="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                  onclick={() => removeCost(index)}
                  type="button"
                  title="Remove this cost"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    class="w-4 h-4"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <!-- Cost details (collapsible) -->
              {#if isExpanded}
                <div class="p-4 space-y-4 border-t border-base-300">
                  <!-- Rules placeholder -->
                  <div class="form-control">
                    <div class="label py-0.5">
                      <span class="label-text text-xs font-semibold">Rules</span
                      >
                      <span class="badge badge-xs badge-ghost">Coming Soon</span
                      >
                    </div>
                    <div
                      class="text-xs bg-base-200/50 px-3 py-2 rounded border border-dashed border-base-300 text-base-content/40 italic"
                    >
                      Rules-based cost logic will be configured here
                    </div>
                  </div>

                  <!-- Tier Rules section -->
                  <div class="form-control">
                    <div class="label py-0.5">
                      <span class="label-text text-xs font-semibold">Tier Rules</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline flex-1 justify-start text-xs"
                        onclick={() => openTierRulesEditor(index)}
                      >
                        {getTierRulesSummary(cost.tier_rules)}
                      </button>
                      {#if cost.tier_rules?.type === 'ANY_OF' && cost.tier_rules.any_of?.length > 0}
                        <div class="badge badge-sm badge-primary">
                          {cost.tier_rules.any_of.length}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <!-- Spending section -->
                  <div class="border-t border-base-300 pt-3">
                    <div
                      class="text-xs font-semibold text-base-content/70 mb-2 flex items-center gap-2"
                    >
                      <span>Spending</span>
                      <span class="badge badge-xs badge-ghost"
                        >One wallet per cost</span
                      >
                    </div>

                    <div class="space-y-3">
                      <!-- Points input -->
                      <div class="form-control">
                        <label class="label py-0.5" for="points-{index}">
                          <span class="label-text text-xs font-semibold"
                            >Points</span
                          >
                        </label>
                        <input
                          id="points-{index}"
                          type="number"
                          class="input input-sm input-bordered w-full font-mono"
                          placeholder="Enter points"
                          value={spending.points || ""}
                          oninput={(e) => updatePoints(index, e.target.value)}
                          min="1"
                        />
                      </div>

                      <!-- Wallet selection -->
                      <div class="form-control">
                        <label class="label py-0.5" for="wallet-{index}">
                          <span class="label-text text-xs font-semibold"
                            >Wallet (Card Definition)</span
                          >
                        </label>
                        <select
                          id="wallet-{index}"
                          class="select select-sm select-bordered w-full font-mono text-xs"
                          value={spending.card_definition_id || ""}
                          onchange={(e) =>
                            updateCardDefinition(index, e.target.value)}
                        >
                          <option value="">Select a wallet...</option>
                          {#each availableCardDefinitions as cardDef}
                            <option value={cardDef.id}
                              >{cardDef.name || cardDef.id}</option
                            >
                          {/each}
                        </select>
                        {#if availableCardDefinitions.length === 0}
                          <div class="label py-0.5">
                            <span class="label-text-alt text-warning"
                              >No card definitions available</span
                            >
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>

      <!-- Add cost button -->
      <button
        class="btn btn-outline btn-sm w-full gap-2"
        onclick={addCost}
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="w-4 h-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        Add Cost
      </button>

      <!-- Footer actions -->
      <div class="flex justify-end gap-2 pt-2 border-t border-base-300">
        <button class="btn btn-ghost btn-sm" onclick={onCancel} type="button">
          Cancel
        </button>
        <button
          class="btn btn-primary btn-sm"
          onclick={handleSave}
          disabled={!isValid}
          type="button"
          title={!isValid
            ? "Please fill in all required fields with valid values"
            : ""}
        >
          Save Costs
        </button>
      </div>
    </div>
  </div>
</div>

{#if tierRulesEditorOpen && tierRulesBeingEdited !== null}
  <TierRulesEditor
    initialTierRules={tierRulesBeingEdited}
    availableTierStructures={availableTierStructures}
    onSave={saveTierRules}
    onCancel={closeTierRulesEditor}
  />
{/if}
