<script>
  /**
   * FieldValueList component for displaying field-value pairs in a 2-column grid
   * Used for expanded details across different entity types
   * Uses entity configuration to display only properties that belong to the entity
   */
  import { getEntityProperties } from "../config/entityProperties.js";

  let { item = {}, entityType = "", cardDefinitions = [] } = $props();

  // Create a lookup map for card definitions
  let cardDefinitionsById = $derived(
    cardDefinitions.reduce((acc, cd) => {
      acc[cd.id] = cd;
      return acc;
    }, {}),
  );

  // Get all configured properties for this entity type
  let configuredFields = $derived(
    entityType ? Object.keys(getEntityProperties(entityType)) : [],
  );

  // Filter item to show only configured properties that exist in the item
  let displayFields = $derived(
    configuredFields
      .filter((fieldName) => fieldName in item && item[fieldName] !== undefined)
      .map((fieldName) => [fieldName, item[fieldName]]),
  );

  function formatValue(val) {
    if (val === null || val === undefined) return "null";
    if (typeof val === "boolean") return val ? "true" : "false";
    if (typeof val === "object") return JSON.stringify(val, null, 2);
    return String(val);
  }

  function formatTimestamp(val) {
    if (!val) return null;
    try {
      return new Date(val).toLocaleString();
    } catch {
      return val;
    }
  }

  function formatCosts(costs) {
    if (!Array.isArray(costs) || costs.length === 0) {
      return null;
    }
    return costs
      .map((cost, index) => {
        const spending = cost.spending?.[0];
        if (!spending) return null;

        const cardName =
          cardDefinitionsById[spending.card_definition_id]?.name ||
          spending.card_definition_id ||
          "Unknown";
        const tierRulesSummary = getTierRulesSummary(cost.tier_rules);

        return {
          index: index + 1,
          points: spending.points,
          cardName,
          id: cost.id,
          tierRulesSummary,
        };
      })
      .filter(Boolean);
  }

  function formatEarnings(earnings) {
    if (!Array.isArray(earnings) || earnings.length === 0) {
      return null;
    }
    return earnings
      .map((block, index) => {
        const effects = block.effects || [];
        const effectsSummary = effects.map((eff) => {
          if (eff.type === "POINTS") return "Points";
          if (eff.type === "INCENTIVE") return "Incentive";
          if (eff.type === "POINTS_PROPORTIONAL") return "Points Proportional";
          return eff.type;
        });
        const tierRulesSummary = getTierRulesSummary(block.tier_rules);

        return {
          index: index + 1,
          name: block.name || `Block ${index + 1}`,
          effectCount: effects.length,
          effectsSummary: effectsSummary.join(", "),
          id: block.id,
          tierRulesSummary,
        };
      })
      .filter(Boolean);
  }

  function getTierRulesSummary(tierRules) {
    if (!tierRules || tierRules.type === "NO_REQUIREMENTS") {
      return "No requirements";
    }
    if (tierRules.type === "ANY_OF") {
      const count = tierRules.any_of?.length || 0;
      return count > 0
        ? `Any of ${count} tier combination${count !== 1 ? "s" : ""}`
        : "No combinations";
    }
    return "Unknown";
  }
</script>

<div class="divider my-1"></div>
<div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-xs">
  <!-- Always show timestamps first -->
  {#if item.created_at}
    <span class="text-base-content/50 pt-2">created_at</span>
    <span class="font-mono pt-2">{formatTimestamp(item.created_at)}</span>
  {/if}
  {#if item.updated_at}
    <span class="text-base-content/50 pt-2">updated_at</span>
    <span class="font-mono pt-2">{formatTimestamp(item.updated_at)}</span>
  {/if}

  <!-- Display only configured properties -->
  {#each displayFields as [key, value]}
    <span class="text-base-content/50 pt-2 break-all">{key}</span>
    {#if key === "costs" && entityType === "rewards"}
      <!-- Special rendering for reward costs -->
      {@const formattedCosts = formatCosts(value)}
      {#if formattedCosts && formattedCosts.length > 0}
        <div class="space-y-2">
          <div class="text-xs text-base-content/60 mb-1">
            {formattedCosts.length} cost{formattedCosts.length !== 1 ? "s" : ""}
            configured
          </div>
          {#each formattedCosts as cost}
            <div class="bg-base-200 rounded p-2 text-xs space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold">Cost {cost.index}:</span>
                <span class="badge badge-xs badge-ghost font-mono"
                  >{cost.points} pts</span
                >
              </div>
              <div class="text-base-content/60">
                From wallet: <span class="font-mono">{cost.cardName}</span>
              </div>
              <div class="text-base-content/60">
                Tier rules: <span class="font-mono text-[10px]"
                  >{cost.tierRulesSummary}</span
                >
              </div>
              {#if cost.id}
                <div class="text-base-content/40 text-[10px] font-mono">
                  ID: {cost.id}
                </div>
              {/if}
            </div>
          {/each}
          <details class="collapse collapse-arrow bg-base-200/50 rounded">
            <summary
              class="collapse-title text-[10px] min-h-0 py-1 px-2 cursor-pointer"
            >
              View raw JSON
            </summary>
            <div class="collapse-content px-2 pb-2">
              <pre
                class="font-mono text-[10px] bg-base-300 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">{formatValue(
                  value,
                )}</pre>
            </div>
          </details>
        </div>
      {:else}
        <pre
          class="font-mono text-xs bg-base-200 rounded p-2 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">{formatValue(
            value,
          )}</pre>
      {/if}
    {:else if key === "earnings" && entityType === "earningRules"}
      <!-- Special rendering for earning rules earnings -->
      {@const formattedEarnings = formatEarnings(value)}
      {#if formattedEarnings && formattedEarnings.length > 0}
        <div class="space-y-2">
          <div class="text-xs text-base-content/60 mb-1">
            {formattedEarnings.length} earning block{formattedEarnings.length !==
            1
              ? "s"
              : ""} configured
          </div>
          {#each formattedEarnings as block}
            <div class="bg-base-200 rounded p-2 text-xs space-y-1">
              <div class="flex items-center gap-2">
                <span class="font-semibold">{block.name}</span>
                <span class="badge badge-xs badge-ghost"
                  >{block.effectCount} effect{block.effectCount !== 1
                    ? "s"
                    : ""}</span
                >
              </div>
              {#if block.effectsSummary}
                <div class="text-base-content/60">
                  Effects: <span class="font-mono text-[10px]"
                    >{block.effectsSummary}</span
                  >
                </div>
              {/if}
              {#if block.tierRulesSummary}
                <div class="text-base-content/60">
                  Tier rules: <span class="font-mono text-[10px]"
                    >{block.tierRulesSummary}</span
                  >
                </div>
              {/if}
              {#if block.id}
                <div class="text-base-content/40 text-[10px] font-mono">
                  ID: {block.id}
                </div>
              {/if}
            </div>
          {/each}
          <details class="collapse collapse-arrow bg-base-200/50 rounded">
            <summary
              class="collapse-title text-[10px] min-h-0 py-1 px-2 cursor-pointer"
            >
              View raw JSON
            </summary>
            <div class="collapse-content px-2 pb-2">
              <pre
                class="font-mono text-[10px] bg-base-300 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">{formatValue(
                  value,
                )}</pre>
            </div>
          </details>
        </div>
      {:else}
        <pre
          class="font-mono text-xs bg-base-200 rounded p-2 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">{formatValue(
            value,
          )}</pre>
      {/if}
    {:else if typeof value === "object" && value !== null}
      <pre
        class="font-mono text-xs bg-base-200 rounded p-2 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">{formatValue(
          value,
        )}</pre>
    {:else}
      <span class="font-mono pt-2 break-all">{formatValue(value)}</span>
    {/if}
  {/each}
</div>
