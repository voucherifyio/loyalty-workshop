<script>
  let {
    type = 'costs', // 'costs' | 'earnings'
    value = [],
    disabled = false,
    tooltip = '',
    onOpen = () => {},
    onClear = () => {}
  } = $props();

  const labels = {
    costs: {
      singular: 'cost',
      plural: 'costs',
      button: 'Configure costs',
      clear: 'Clear costs'
    },
    earnings: {
      singular: 'earning block',
      plural: 'earning blocks',
      button: 'Configure earnings',
      clear: 'Clear earnings'
    }
  };

  const label = $derived(labels[type] || labels.costs);
  const count = $derived(value?.length || 0);
  const countText = $derived(
    count > 0
      ? `${count} ${count === 1 ? label.singular : label.plural} configured`
      : label.button
  );
</script>

<div class="flex items-center gap-2">
  <button
    type="button"
    class="btn btn-sm btn-outline flex-1 justify-start font-mono text-xs {disabled ? 'btn-disabled' : ''}"
    onclick={onOpen}
    {disabled}
    title={tooltip || label.button}
  >
    {countText}
  </button>
  {#if count > 0}
    <button
      type="button"
      class="btn btn-sm btn-ghost btn-circle"
      onclick={onClear}
      {disabled}
      title={label.clear}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>
