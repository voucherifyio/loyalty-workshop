<script>
  let {
    member,
    refreshing = false,
    onRefresh = () => {},
    onBack = () => {},
  } = $props();
</script>

<div class="bg-base-200/50 rounded-xl p-5">
  <div class="flex items-start justify-between">
    <div class="flex items-center gap-3 flex-1">
      <button
        class="btn btn-ghost btn-sm btn-circle"
        onclick={onBack}
        title="Back to program"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold">Member: {member.id}</h1>
        {#if member.customer_id}
          <p class="text-sm text-base-content/60 mt-1">Customer: {member.customer_id}</p>
        {/if}
      </div>
    </div>
    <button
      class="btn btn-sm btn-ghost"
      onclick={onRefresh}
      disabled={refreshing}
    >
      {#if refreshing}
        <span class="loading loading-spinner loading-xs"></span>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      {/if}
      Refresh
    </button>
  </div>
</div>
