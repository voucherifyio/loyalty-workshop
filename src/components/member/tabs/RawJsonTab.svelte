<script>
  import JsonDisplay from "../../shared/JsonDisplay.svelte";

  let { member = null } = $props();
</script>

<div>
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">Raw JSON — Member</p>
  {#if member}
    <JsonDisplay data={member} size="xs" maxHeight="max-h-[60vh]" />
  {:else}
    <div class="alert alert-info text-sm"><span>No member data loaded</span></div>
  {/if}
</div>
