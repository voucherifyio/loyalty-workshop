<script>
  let { 
    entityType = '',
    status = '',
    hovered = false,
    onStatusChange = () => {},
    onExpand = null
  } = $props();
  
  // Only Activate and Deactivate as quick-access shortcuts on the card
  function getQuickTransitions(entityType, currentStatus) {
    if (currentStatus === 'DRAFT' || currentStatus === 'INACTIVE') {
      return [{ action: 'activate', toStatus: 'ACTIVE', label: 'Activate', icon: 'play' }];
    }
    if (currentStatus === 'ACTIVE') {
      return [{ action: 'deactivate', toStatus: 'INACTIVE', label: 'Deactivate', icon: 'pause' }];
    }
    return [];
  }
  
  const transitions = $derived(getQuickTransitions(entityType, status));
</script>

<div class="absolute top-2 right-2 z-10">
  <div class="join join-horizontal bg-base-100/90 rounded-lg transition-opacity {hovered ? 'opacity-100' : 'opacity-0'}">
    {#each transitions as transition}
      <button
        class="btn btn-xs btn-circle join-item tooltip tooltip-bottom {transition.icon === 'play' ? 'btn-success' : 'btn-error'}"
        data-tip={transition.label}
        onclick={(e) => { e.stopPropagation(); onStatusChange(transition.action, transition.toStatus); }}
      >
        {#if transition.icon === 'play'}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
          </svg>
        {/if}
      </button>
    {/each}
    {#if onExpand}
      <button
        class="btn btn-xs btn-circle btn-ghost join-item tooltip tooltip-bottom"
        data-tip="Details"
        onclick={(e) => { e.stopPropagation(); onExpand(); }}
        aria-label="Details"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      </button>
    {/if}
  </div>
</div>

