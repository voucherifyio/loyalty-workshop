<script>
  import EntityCard from './EntityCard.svelte';
  import PaginationFooter from './PaginationFooter.svelte';
  
  let { 
    entityType = '',
    items = [],
    icon = '',
    name = '',
    loading = false,
    hasMore = false,
    loadingMore = false,
    countdown = '',
    getClasses = () => '',
    usage = {},
    shakeCard = null,
    removingCard = null,
    extraBadges,
    bodyContent,
    onCreate = null,
    onSelect = () => {},
    onStatusChange = () => {},
    onExpand = null,
    onLoadMore = () => {},
    onRefresh = () => {},
    // Assignment mode props
    assignmentMode = false,
    isEntityAssigned = () => false,
    onToggleAssign = null,
  } = $props();
</script>

<div class="card flex-1 bg-base-200 overflow-y-auto flex flex-col">
  <div class="sticky top-0 bg-base-200 z-10">
    <div class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          {@html icon}
          <h2 class="text-lg font-bold">{name} ({items.length})</h2>
        </div>
        <div class="flex items-center gap-1">
          {#if onCreate}
            <button
              class="btn btn-circle btn-xs btn-primary"
              onclick={onCreate}
              title="Create {name}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>
    <div class="divider m-0"></div>
  </div>
  
  <div class="p-4 flex-1 overflow-y-auto">
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    {:else if items.length === 0}
      <p class="text-xs text-base-content/50 text-center py-8">
        {#if assignmentMode}
          No {name.toLowerCase()} available to assign
        {:else}
          No {name.toLowerCase()}
        {/if}
      </p>
    {:else}
      <div class="space-y-2">
        {#each items as item (item.id)}
          <EntityCard
            {entityType}
            {item}
            cssClasses={getClasses(entityType, item)}
            usage={usage[item.id] || 0}
            isShaking={shakeCard?.type === entityType && shakeCard?.id === item.id}
            isRemoving={removingCard?.type === entityType && removingCard?.id === item.id}
            {extraBadges}
            {bodyContent}
            {onSelect}
            {onStatusChange}
            onExpand={onExpand ? () => onExpand(entityType, item.id) : null}
            {assignmentMode}
            isAssigned={isEntityAssigned(entityType, item.id)}
            onToggleAssign={onToggleAssign ? (id) => onToggleAssign(entityType, id) : null}
          />
        {/each}
      </div>
    {/if}
    
    <PaginationFooter
      {hasMore}
      loading={loadingMore}
      {countdown}
      itemCount={items.length}
      {onLoadMore}
      {onRefresh}
    />
  </div>
</div>
