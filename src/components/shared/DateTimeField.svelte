<script>
  let {
    value = null,
    fieldName = '',
    disabled = false,
    hasError = false,
    tooltip = '',
    onInput = () => {},
    onClear = () => {}
  } = $props();

  /**
   * Convert ISO string or null to datetime-local format
   */
  function toDateTimeLocalValue(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      // Format: YYYY-MM-DDTHH:MM (local timezone)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  }

  function handleInput(e) {
    const localValue = e.target.value;
    if (!localValue) {
      onInput(null);
      return;
    }
    // Convert datetime-local to ISO string
    try {
      const isoString = new Date(localValue).toISOString();
      onInput(isoString);
    } catch {
      onInput(null);
    }
  }
</script>

<div class="flex items-center gap-2">
  <input
    type="datetime-local"
    class="input input-sm input-bordered font-mono text-xs w-full {disabled ? 'cursor-not-allowed opacity-60' : ''} {hasError ? 'input-error border-error' : ''}"
    value={toDateTimeLocalValue(value)}
    oninput={handleInput}
    {disabled}
    title={tooltip}
  />
  {#if value}
    <button
      type="button"
      class="btn btn-sm btn-ghost btn-circle shrink-0"
      onclick={onClear}
      {disabled}
      title="Clear date"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>
