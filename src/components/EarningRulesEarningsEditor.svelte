<script>
  import TierRulesEditor from './TierRulesEditor.svelte';

  let {
    initialEarnings = [],
    availableCardDefinitions = [],
    availableIncentives = [],
    availableTierStructures = [],
    onSave = () => {},
    onCancel = () => {},
  } = $props();

  // Initialize earnings from props (only once)
  let initialized = $state(false);
  let earnings = $state([]);

  // Track which earning blocks are expanded
  let expandedBlocks = $state(new Set());

  // State for tier rules editor modal
  let tierRulesEditorOpen = $state(false);
  let tierRulesBeingEdited = $state(null);
  let tierRulesEditIndex = $state(null);

  // Initialize earnings once when component mounts
  $effect(() => {
    if (!initialized && initialEarnings.length > 0) {
      earnings = JSON.parse(JSON.stringify(initialEarnings)); // Deep clone
      // Ensure tier_rules has a default value if missing
      earnings = earnings.map(block => ({
        ...block,
        tier_rules: block.tier_rules || { type: 'NO_REQUIREMENTS', any_of: [] }
      }));
      expandedBlocks = new Set(earnings.map((_, i) => i));
      initialized = true;
    }
  });

  function toggleExpand(index) {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    expandedBlocks = newExpanded;
  }

  function addEarningBlock() {
    const newBlock = {
      name: "",
      rules: {},
      tier_rules: { type: 'NO_REQUIREMENTS', any_of: [] },
      effects: [],
    };
    earnings = [...earnings, newBlock];
    expandedBlocks = new Set([...expandedBlocks, earnings.length - 1]);
  }

  function removeEarningBlock(index) {
    earnings = earnings.filter((_, i) => i !== index);
    // Update expanded indices
    const newExpanded = new Set();
    expandedBlocks.forEach((i) => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    expandedBlocks = newExpanded;
  }

  function updateBlockName(index, value) {
    earnings[index].name = value;
  }

  function addEffect(blockIndex) {
    const newEffect = {
      type: "POINTS",
      points: {
        value: 0,
        card_definition_id: "",
        expiration: null,
      },
    };
    earnings[blockIndex].effects = [...earnings[blockIndex].effects, newEffect];
  }

  function removeEffect(blockIndex, effectIndex) {
    earnings[blockIndex].effects = earnings[blockIndex].effects.filter(
      (_, i) => i !== effectIndex,
    );
  }

  function updateEffectType(blockIndex, effectIndex, newType) {
    const effect = earnings[blockIndex].effects[effectIndex];
    effect.type = newType;

    // Clear all type-specific fields
    delete effect.points;
    delete effect.incentive;
    delete effect.points_proportional;

    // Initialize appropriate field based on type
    if (newType === "POINTS") {
      effect.points = {
        value: 0,
        card_definition_id: "",
        expiration: null,
      };
    } else if (newType === "INCENTIVE") {
      effect.incentive = { id: "" };
    } else if (newType === "POINTS_PROPORTIONAL") {
      effect.points_proportional = null;
    }

    // Trigger reactivity
    earnings[blockIndex].effects = [...earnings[blockIndex].effects];
  }

  function updatePointsValue(blockIndex, effectIndex, value) {
    earnings[blockIndex].effects[effectIndex].points.value =
      parseInt(value) || 0;
  }

  function updatePointsCardDef(blockIndex, effectIndex, value) {
    earnings[blockIndex].effects[effectIndex].points.card_definition_id = value;
  }

  function updatePointsExpiration(blockIndex, effectIndex, value) {
    try {
      earnings[blockIndex].effects[effectIndex].points.expiration = value
        ? JSON.parse(value)
        : null;
    } catch {
      // Keep as string if invalid JSON
      earnings[blockIndex].effects[effectIndex].points.expiration =
        value || null;
    }
  }

  function updateIncentiveId(blockIndex, effectIndex, value) {
    earnings[blockIndex].effects[effectIndex].incentive.id = value;
  }

  function updatePointsProportional(blockIndex, effectIndex, value) {
    try {
      earnings[blockIndex].effects[effectIndex].points_proportional = value
        ? JSON.parse(value)
        : null;
    } catch {
      // Keep as string if invalid JSON
      earnings[blockIndex].effects[effectIndex].points_proportional =
        value || null;
    }
  }

  // Validation
  const isValid = $derived(
    earnings.length === 0 ||
      earnings.every((block) => {
        // At least one effect required
        if (!block.effects || block.effects.length === 0) return false;
        // All effects must be valid
        return block.effects.every((effect) => {
          if (effect.type === "POINTS") {
            return (
              effect.points?.value > 0 && effect.points?.card_definition_id
            );
          } else if (effect.type === "INCENTIVE") {
            return effect.incentive?.id;
          } else if (effect.type === "POINTS_PROPORTIONAL") {
            return effect.points_proportional !== undefined;
          }
          return false;
        });
      }),
  );

  function handleSave() {
    if (!isValid) return;
    // Remove rules field from earnings before saving (not needed yet, causes validation errors)
    // Keep tier_rules - it's a real field we want to send
    const earningsToSave = earnings.map((block) => {
      const { rules, ...blockWithoutRules } = block;
      return blockWithoutRules;
    });
    onSave(earningsToSave);
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel();
  }

  // Helper to get effect type label
  function getEffectTypeLabel(type) {
    const labels = {
      POINTS: "Points",
      INCENTIVE: "Incentive",
      POINTS_PROPORTIONAL: "Points Proportional",
    };
    return labels[type] || type;
  }

  function openTierRulesEditor(index) {
    tierRulesEditIndex = index;
    tierRulesBeingEdited = JSON.parse(JSON.stringify(earnings[index].tier_rules || { type: 'NO_REQUIREMENTS', any_of: [] }));
    tierRulesEditorOpen = true;
  }

  function closeTierRulesEditor() {
    tierRulesEditorOpen = false;
    tierRulesBeingEdited = null;
    tierRulesEditIndex = null;
  }

  function saveTierRules(tierRules) {
    if (tierRulesEditIndex !== null) {
      earnings[tierRulesEditIndex].tier_rules = tierRules;
      // Trigger reactivity
      earnings = [...earnings];
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
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  aria-label="Earnings configuration"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === "Escape" && onCancel()}
  tabindex="-1"
>
  <div
    class="card bg-base-100 shadow-2xl w-[700px] max-w-full max-h-[85vh] flex flex-col"
  >
    <div class="card-body p-5 space-y-4 flex flex-col overflow-hidden">
      <div>
        <h3 class="font-bold text-base">Configure Earnings</h3>
        <p class="text-xs text-base-content/50 mt-0.5">
          Define one or more earning blocks with effects. Each block can have
          rules-based logic (coming soon).
        </p>
      </div>

      <!-- Earnings list -->
      <div class="flex-1 overflow-y-auto space-y-3 min-h-0">
        {#if earnings.length === 0}
          <div class="text-center py-8 text-base-content/50">
            <p class="text-sm">No earning blocks configured</p>
            <p class="text-xs mt-1">
              Click "Add Earning Block" to create a new earning configuration
            </p>
          </div>
        {:else}
          {#each earnings as block, blockIndex (blockIndex)}
            {@const isExpanded = expandedBlocks.has(blockIndex)}

            <div class="border border-base-300 rounded-lg overflow-hidden">
              <!-- Block header -->
              <div
                class="w-full flex items-center justify-between p-3 bg-base-200/50"
              >
                <button
                  class="flex items-center gap-2 text-left flex-1 min-w-0 hover:opacity-70 transition-opacity"
                  onclick={() => toggleExpand(blockIndex)}
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
                  <span class="text-sm font-semibold"
                    >Block {blockIndex + 1}</span
                  >
                  {#if block.name}
                    <span
                      class="badge badge-xs badge-ghost font-mono truncate max-w-[200px]"
                    >
                      {block.name}
                    </span>
                  {/if}
                  {#if block.effects?.length}
                    <span class="badge badge-xs badge-outline">
                      {block.effects.length} effect{block.effects.length !== 1
                        ? "s"
                        : ""}
                    </span>
                  {/if}
                </button>
                <button
                  class="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                  onclick={() => removeEarningBlock(blockIndex)}
                  type="button"
                  title="Remove this earning block"
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

              <!-- Block details (collapsible) -->
              {#if isExpanded}
                <div class="p-4 space-y-4 border-t border-base-300">
                  <!-- Block name -->
                  <div class="form-control">
                    <label class="label py-0.5" for="block-name-{blockIndex}">
                      <span class="label-text text-xs font-semibold"
                        >Block Name</span
                      >
                      <span class="label-text-alt text-base-content/50">Optional</span>
                    </label>
                    <input
                      id="block-name-{blockIndex}"
                      type="text"
                      class="input input-sm input-bordered w-full"
                      placeholder="e.g., Base Earnings, Bonus, etc."
                      value={block.name || ""}
                      oninput={(e) =>
                        updateBlockName(blockIndex, e.target.value)}
                    />
                  </div>

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
                      Rules-based earning logic will be configured here
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
                        onclick={() => openTierRulesEditor(blockIndex)}
                      >
                        {getTierRulesSummary(block.tier_rules)}
                      </button>
                      {#if block.tier_rules?.type === 'ANY_OF' && block.tier_rules.any_of?.length > 0}
                        <div class="badge badge-sm badge-primary">
                          {block.tier_rules.any_of.length}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <!-- Effects section -->
                  <div class="border-t border-base-300 pt-3">
                    <div
                      class="text-xs font-semibold text-base-content/70 mb-2 flex items-center justify-between"
                    >
                      <span>Effects</span>
                      <button
                        class="btn btn-xs btn-outline btn-primary gap-1"
                        onclick={() => addEffect(blockIndex)}
                        type="button"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="2"
                          stroke="currentColor"
                          class="w-3 h-3"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                        Add Effect
                      </button>
                    </div>

                    {#if block.effects?.length === 0}
                      <div
                        class="text-center py-4 text-base-content/40 text-xs border border-dashed border-base-300 rounded"
                      >
                        No effects yet. Click "Add Effect" to add one.
                      </div>
                    {:else}
                      <div class="space-y-3">
                        {#each block.effects as effect, effectIndex (effectIndex)}
                          <div
                            class="border border-base-300 rounded-lg p-3 space-y-3 bg-base-100"
                          >
                            <!-- Effect header with type selector and remove button -->
                            <div class="flex items-center gap-2">
                              <div class="form-control flex-1">
                                <label
                                  class="label py-0"
                                  for="effect-type-{blockIndex}-{effectIndex}"
                                >
                                  <span class="label-text text-xs font-semibold"
                                    >Effect Type</span
                                  >
                                </label>
                                <select
                                  id="effect-type-{blockIndex}-{effectIndex}"
                                  class="select select-sm select-bordered font-mono text-xs"
                                  value={effect.type}
                                  onchange={(e) =>
                                    updateEffectType(
                                      blockIndex,
                                      effectIndex,
                                      e.target.value,
                                    )}
                                >
                                  <option value="POINTS">Points</option>
                                  <option value="INCENTIVE">Incentive</option>
                                  <option value="POINTS_PROPORTIONAL"
                                    >Points Proportional</option
                                  >
                                </select>
                              </div>
                              <button
                                class="btn btn-ghost btn-xs btn-circle text-error self-end mb-0.5"
                                onclick={() =>
                                  removeEffect(blockIndex, effectIndex)}
                                type="button"
                                title="Remove effect"
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

                            <!-- Type-specific fields -->
                            {#if effect.type === "POINTS"}
                              <div
                                class="space-y-2 pl-2 border-l-2 border-primary/20"
                              >
                                <!-- Value -->
                                <div class="form-control">
                                  <label
                                    class="label py-0.5"
                                    for="points-value-{blockIndex}-{effectIndex}"
                                  >
                                    <span
                                      class="label-text text-xs font-semibold"
                                      >Points Value</span
                                    >
                                  </label>
                                  <input
                                    id="points-value-{blockIndex}-{effectIndex}"
                                    type="number"
                                    class="input input-sm input-bordered w-full font-mono"
                                    placeholder="Enter points value"
                                    value={effect.points?.value || ""}
                                    oninput={(e) =>
                                      updatePointsValue(
                                        blockIndex,
                                        effectIndex,
                                        e.target.value,
                                      )}
                                    min="1"
                                  />
                                </div>

                                <!-- Card Definition -->
                                <div class="form-control">
                                  <label
                                    class="label py-0.5"
                                    for="points-card-{blockIndex}-{effectIndex}"
                                  >
                                    <span
                                      class="label-text text-xs font-semibold"
                                      >Card Definition (Wallet)</span
                                    >
                                  </label>
                                  <select
                                    id="points-card-{blockIndex}-{effectIndex}"
                                    class="select select-sm select-bordered w-full font-mono text-xs"
                                    value={effect.points?.card_definition_id ||
                                      ""}
                                    onchange={(e) =>
                                      updatePointsCardDef(
                                        blockIndex,
                                        effectIndex,
                                        e.target.value,
                                      )}
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

                                <!-- Expiration (JSON) -->
                                <div class="form-control">
                                  <label
                                    class="label py-0.5"
                                    for="points-exp-{blockIndex}-{effectIndex}"
                                  >
                                    <span
                                      class="label-text text-xs font-semibold"
                                      >Expiration (JSON)</span
                                    >
                                    <span
                                      class="label-text-alt text-base-content/50"
                                      >Optional</span
                                    >
                                  </label>
                                  <textarea
                                    id="points-exp-{blockIndex}-{effectIndex}"
                                    class="textarea textarea-sm textarea-bordered font-mono text-xs"
                                    rows="2"
                                    placeholder=""
                                    value={effect.points?.expiration
                                      ? JSON.stringify(
                                          effect.points.expiration,
                                          null,
                                          2,
                                        )
                                      : ""}
                                    onblur={(e) =>
                                      updatePointsExpiration(
                                        blockIndex,
                                        effectIndex,
                                        e.target.value,
                                      )}
                                  ></textarea>
                                </div>
                              </div>
                            {:else if effect.type === "INCENTIVE"}
                              <div
                                class="space-y-2 pl-2 border-l-2 border-secondary/20"
                              >
                                <!-- Incentive selector -->
                                <div class="form-control">
                                  <label
                                    class="label py-0.5"
                                    for="incentive-{blockIndex}-{effectIndex}"
                                  >
                                    <span
                                      class="label-text text-xs font-semibold"
                                      >Incentive</span
                                    >
                                  </label>
                                  <select
                                    id="incentive-{blockIndex}-{effectIndex}"
                                    class="select select-sm select-bordered w-full font-mono text-xs"
                                    value={effect.incentive?.id || ""}
                                    onchange={(e) =>
                                      updateIncentiveId(
                                        blockIndex,
                                        effectIndex,
                                        e.target.value,
                                      )}
                                  >
                                    <option value=""
                                      >Select an incentive...</option
                                    >
                                    {#each availableIncentives as incentive}
                                      <option value={incentive.id}
                                        >{incentive.name ||
                                          incentive.id}</option
                                      >
                                    {/each}
                                  </select>
                                  {#if availableIncentives.length === 0}
                                    <div class="label py-0.5">
                                      <span class="label-text-alt text-warning"
                                        >No incentives available</span
                                      >
                                    </div>
                                  {/if}
                                </div>
                              </div>
                            {:else if effect.type === "POINTS_PROPORTIONAL"}
                              <div
                                class="space-y-2 pl-2 border-l-2 border-accent/20"
                              >
                                <!-- Points Proportional (JSON) -->
                                <div class="form-control">
                                  <label
                                    class="label py-0.5"
                                    for="points-prop-{blockIndex}-{effectIndex}"
                                  >
                                    <span
                                      class="label-text text-xs font-semibold"
                                      >Points Proportional Configuration (JSON)</span
                                    >
                                  </label>
                                  <textarea
                                    id="points-prop-{blockIndex}-{effectIndex}"
                                    class="textarea textarea-sm textarea-bordered font-mono text-xs"
                                    rows="3"
                                    placeholder=""
                                    value={effect.points_proportional
                                      ? JSON.stringify(
                                          effect.points_proportional,
                                          null,
                                          2,
                                        )
                                      : ""}
                                    onblur={(e) =>
                                      updatePointsProportional(
                                        blockIndex,
                                        effectIndex,
                                        e.target.value,
                                      )}
                                  ></textarea>
                                </div>
                              </div>
                            {/if}
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>

      <!-- Add earning block button -->
      <button
        class="btn btn-outline btn-sm w-full gap-2"
        onclick={addEarningBlock}
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
        Add Earning Block
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
          Save Earnings
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
