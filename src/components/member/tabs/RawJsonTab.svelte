<script>
  let { member = null } = $props();
</script>

<div>
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">Raw JSON — Member</p>
  {#if member}
    <pre class="text-[9px] bg-base-200 p-3 rounded-lg overflow-x-auto max-h-[60vh]">{JSON.stringify(member, null, 2)}</pre>
  {:else}
    <div class="alert alert-info text-sm"><span>No member data loaded</span></div>
  {/if}
</div>
