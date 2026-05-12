<script>
  let { 
    hasMore = false,
    loading = false,
    countdown = '',
    itemCount = 0,
    onLoadMore = () => {},
    onRefresh = () => {}
  } = $props();
</script>

{#if !loading}
  {#if countdown === 'expired' && hasMore}
    <button 
      class="btn btn-link btn-xs btn-warning w-full mt-4"
      onclick={onRefresh}
      disabled={loading}
    >
      {loading ? 'Refreshing...' : 'Cursor Expired - Refresh'}
    </button>
  {:else if hasMore}
    <button 
      class="btn btn-link btn-xs w-full mt-4"
      onclick={onLoadMore}
      disabled={loading}
    >
      {loading ? 'Loading...' : `Load More${countdown ? ` (${countdown})` : ''}`}
    </button>
  {:else if itemCount > 0}
    <p class="text-xs text-base-content/40 text-center mt-4">No more items</p>
  {/if}
{/if}
