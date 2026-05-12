<script>
  let {
    items = [],
    value = null,
    loading = false,
    placeholder = "Select...",
    searchable = true,
    displayKey = "name",
    idKey = "id",
    disabled = false,
    hasMore = false,
    onLoadMore = () => {},
    onChange = () => {}
  } = $props();

  let searchTerm = $state('');
  let isOpen = $state(false);

  // Filter items based on search term
  const filteredItems = $derived(() => {
    if (!searchable || !searchTerm.trim()) {
      return items;
    }
    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      const displayValue = item[displayKey]?.toString().toLowerCase() || '';
      return displayValue.includes(term);
    });
  });

  function handleSelect (item) {
    onChange(item);
    isOpen = false;
    searchTerm = '';
  }

  function handleClear () {
    onChange(null);
    searchTerm = '';
  }

  function toggleDropdown () {
    if (!disabled) {
      isOpen = !isOpen;
      if (!isOpen) {
        searchTerm = '';
      }
    }
  }

  // Close dropdown when clicking outside
  function handleClickOutside (event) {
    if (isOpen && !event.target.closest('.searchable-select-container')) {
      isOpen = false;
      searchTerm = '';
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<div class="searchable-select-container relative w-full">
  <!-- Selected value display / trigger button -->
  <button
    type="button"
    class="input input-bordered w-full flex items-center justify-between {disabled ? 'input-disabled' : ''}"
    onclick={toggleDropdown}
    {disabled}
  >
    <span class="flex-1 text-left {!value ? 'text-base-content/50' : ''}">
      {#if loading}
        <span class="loading loading-spinner loading-xs mr-2"></span>
        Loading...
      {:else if value}
        {value[displayKey] || value[idKey]}
      {:else}
        {placeholder}
      {/if}
    </span>
    <div class="flex items-center gap-2">
      {#if value && !disabled}
        <span
          role="button"
          tabindex="0"
          class="btn btn-xs btn-circle btn-ghost"
          onclick={(e) => { e.stopPropagation(); handleClear(); }}
          onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); handleClear(); } }}
          aria-label="Clear selection"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      {/if}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 transition-transform {isOpen ? 'rotate-180' : ''}">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    </div>
  </button>

  <!-- Dropdown menu -->
  {#if isOpen && !disabled}
    <div class="absolute z-50 w-full mt-1 card bg-base-100 shadow-xl border border-base-300 max-h-96 flex flex-col">
      <!-- Search input -->
      {#if searchable}
        <div class="p-2 border-b border-base-300">
          <div class="relative">
            <input
              type="text"
              class="input input-sm input-bordered w-full pl-8"
              placeholder="Search..."
              bind:value={searchTerm}
              onclick={(e) => e.stopPropagation()}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-base-content/50">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
        </div>
      {/if}

      <!-- Items list -->
      <div class="overflow-y-auto flex-1">
        {#if loading}
          <div class="flex items-center justify-center py-8">
            <span class="loading loading-spinner loading-md"></span>
          </div>
        {:else if filteredItems().length === 0}
          <div class="p-4 text-center text-sm text-base-content/50">
            {searchTerm ? 'No matching items found' : 'No items available'}
          </div>
        {:else}
          <ul class="menu menu-sm p-2">
            {#each filteredItems() as item (item[idKey])}
              <li>
                <button
                  type="button"
                  class="flex items-center justify-between {value?.[idKey] === item[idKey] ? 'active' : ''}"
                  onclick={() => handleSelect(item)}
                >
                  <span class="flex-1 text-left truncate">
                    {item[displayKey] || item[idKey]}
                  </span>
                  {#if value?.[idKey] === item[idKey]}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  {/if}
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <!-- Load more button -->
      {#if hasMore && !loading}
        <div class="p-2 border-t border-base-300">
          <button
            type="button"
            class="btn btn-sm btn-ghost w-full"
            onclick={(e) => { e.stopPropagation(); onLoadMore(); }}
          >
            Load More
          </button>
        </div>
      {/if}

      <!-- Item count footer -->
      {#if !loading && items.length > 0}
        <div class="p-2 border-t border-base-300 text-xs text-base-content/50 text-center">
          {filteredItems().length} of {items.length} items
          {#if hasMore}
            (more available)
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
