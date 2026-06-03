<script>
  let {
    filters = $bindable(new Set()),
    options = [],
  } = $props();

  function toggleFilter(value) {
    const newFilters = new Set(filters);
    if (newFilters.has(value)) {
      newFilters.delete(value);
    } else {
      newFilters.add(value);
    }
    filters = newFilters;
  }
</script>

<div class="mb-4">
  <div class="flex items-center justify-between mb-3">
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">
      Filter Transactions
    </p>
  </div>
  <div class="flex gap-2 flex-wrap">
    {#each options as option}
      <button
        class="btn btn-sm {filters.has(option.value) ? `btn-${option.variant}` : 'btn-outline'}"
        onclick={() => toggleFilter(option.value)}
      >
        <span class="badge badge-xs badge-{option.variant} mr-1"></span>
        {option.label}
      </button>
    {/each}
  </div>
</div>
