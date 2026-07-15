<script>
  import JsonDisplay from "../../shared/JsonDisplay.svelte";

  let { data = null } = $props();
</script>

<div>
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">Raw JSON — Membership</p>
  {#if data}
    <JsonDisplay {data} size="xs" maxHeight="max-h-[60vh]" />
  {:else}
    <div class="alert alert-info text-sm"><span>No membership data loaded</span></div>
  {/if}
</div>
