<script>
  let {
    effect,
    blockIndex,
    effectIndex,
    availableCardDefinitions = [],
    availableIncentives = [],
    onUpdateType = () => {},
    onUpdatePointsValue = () => {},
    onUpdatePointsCardDef = () => {},
    onUpdatePointsExpiration = () => {},
    onUpdateIncentiveId = () => {},
    onUpdatePointsProportional = () => {},
    onRemove = () => {}
  } = $props();

  function getEffectTypeLabel(type) {
    const labels = {
      POINTS: "Points",
      INCENTIVE: "Incentive",
      POINTS_PROPORTIONAL: "Points Proportional",
    };
    return labels[type] || type;
  }
</script>

<div class="border border-base-300 rounded-lg p-3 space-y-3 bg-base-100">
  <!-- Effect header with type selector and remove button -->
  <div class="flex items-center gap-2">
    <div class="form-control flex-1">
      <label class="label py-0" for="effect-type-{blockIndex}-{effectIndex}">
        <span class="label-text text-xs font-semibold">Effect Type</span>
      </label>
      <select
        id="effect-type-{blockIndex}-{effectIndex}"
        class="select select-sm select-bordered font-mono text-xs"
        value={effect.type}
        onchange={(e) => onUpdateType(e.target.value)}
      >
        <option value="POINTS">Points</option>
        <option value="INCENTIVE">Incentive</option>
        <option value="POINTS_PROPORTIONAL">Points Proportional</option>
      </select>
    </div>
    <button
      class="btn btn-ghost btn-xs btn-circle text-error self-end mb-0.5"
      onclick={onRemove}
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
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Type-specific fields -->
  {#if effect.type === "POINTS"}
    <div class="space-y-2 pl-2 border-l-2 border-primary/20">
      <!-- Value -->
      <div class="form-control">
        <label class="label py-0.5" for="points-value-{blockIndex}-{effectIndex}">
          <span class="label-text text-xs">Value</span>
        </label>
        <input
          id="points-value-{blockIndex}-{effectIndex}"
          type="number"
          class="input input-sm input-bordered font-mono text-xs"
          placeholder="0"
          min="0"
          value={effect.points?.value || 0}
          oninput={(e) => onUpdatePointsValue(e.target.value)}
        />
      </div>
      <!-- Card Definition -->
      <div class="form-control">
        <label class="label py-0.5" for="points-card-{blockIndex}-{effectIndex}">
          <span class="label-text text-xs">Card Definition</span>
        </label>
        <select
          id="points-card-{blockIndex}-{effectIndex}"
          class="select select-sm select-bordered font-mono text-xs"
          value={effect.points?.card_definition_id || ""}
          onchange={(e) => onUpdatePointsCardDef(e.target.value)}
        >
          <option value="">-- Select Card --</option>
          {#each availableCardDefinitions as cd}
            <option value={cd.id}>{cd.name || cd.id}</option>
          {/each}
        </select>
      </div>
      <!-- Expiration (JSON) -->
      <div class="form-control">
        <label class="label py-0.5" for="points-exp-{blockIndex}-{effectIndex}">
          <span class="label-text text-xs">Expiration (JSON)</span>
        </label>
        <textarea
          id="points-exp-{blockIndex}-{effectIndex}"
          class="textarea textarea-sm textarea-bordered font-mono text-xs"
          rows="2"
          placeholder=""
          value={effect.points?.expiration ? JSON.stringify(effect.points.expiration, null, 2) : ""}
          oninput={(e) => onUpdatePointsExpiration(e.target.value)}
        ></textarea>
      </div>
    </div>
  {:else if effect.type === "INCENTIVE"}
    <div class="space-y-2 pl-2 border-l-2 border-secondary/20">
      <div class="form-control">
        <label class="label py-0.5" for="incentive-id-{blockIndex}-{effectIndex}">
          <span class="label-text text-xs">Incentive ID</span>
        </label>
        <select
          id="incentive-id-{blockIndex}-{effectIndex}"
          class="select select-sm select-bordered font-mono text-xs"
          value={effect.incentive?.id || ""}
          onchange={(e) => onUpdateIncentiveId(e.target.value)}
        >
          <option value="">-- Select Incentive --</option>
          {#each availableIncentives as inc}
            <option value={inc.id}>{inc.name || inc.id}</option>
          {/each}
        </select>
      </div>
    </div>
  {:else if effect.type === "POINTS_PROPORTIONAL"}
    <div class="space-y-2 pl-2 border-l-2 border-accent/20">
      <div class="form-control">
        <label class="label py-0.5" for="points-prop-{blockIndex}-{effectIndex}">
          <span class="label-text text-xs">Points Proportional (JSON)</span>
        </label>
        <textarea
          id="points-prop-{blockIndex}-{effectIndex}"
          class="textarea textarea-sm textarea-bordered font-mono text-xs"
          rows="3"
          placeholder=""
          value={effect.points_proportional ? JSON.stringify(effect.points_proportional, null, 2) : ""}
          oninput={(e) => onUpdatePointsProportional(e.target.value)}
        ></textarea>
      </div>
    </div>
  {/if}
</div>
