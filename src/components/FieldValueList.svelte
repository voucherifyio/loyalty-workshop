<script>
  /**
   * FieldValueList component for displaying field-value pairs in a 2-column grid
   * Used for expanded details across different entity types
   * Matches the pattern used in EntityCard
   */
  let { item = {}, ignoredKeys = [] } = $props();

  const defaultIgnoredKeys = new Set([
    "id",
    "name",
    "status",
    "object",
    "created_at",
    "updated_at",
    "assignments", // Ignore assignments as they're displayed separately in the UI
    "assignedEntities", // Ignore assigned entities as they're displayed separately in the UI
  ]);

  function getDetailEntries(obj) {
    const keysToIgnore = new Set([...defaultIgnoredKeys, ...ignoredKeys]);
    return Object.entries(obj).filter(([key]) => !keysToIgnore.has(key));
  }

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
</script>

<div class="divider my-1"></div>
<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
  {#if item.created_at}
    <span class="text-base-content/50">created_at</span>
    <span class="font-mono">{formatTimestamp(item.created_at)}</span>
  {/if}
  {#if item.updated_at}
    <span class="text-base-content/50">updated_at</span>
    <span class="font-mono">{formatTimestamp(item.updated_at)}</span>
  {/if}
  {#each getDetailEntries(item) as [key, value]}
    <span class="text-base-content/50 break-all">{key}</span>
    {#if typeof value === "object" && value !== null}
      <pre
        class="font-mono text-[10px] bg-base-200 rounded p-1 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">{formatValue(
          value,
        )}</pre>
    {:else}
      <span class="font-mono break-all">{formatValue(value)}</span>
    {/if}
  {/each}
</div>
