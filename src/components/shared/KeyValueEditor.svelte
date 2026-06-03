<script>
  let {
    entries = $bindable([{ key: '', value: '' }]),
    disabled = false,
    keyLabel = 'Key',
    valueLabel = 'Value',
    addButtonLabel = 'Add Entry',
    minRows = 1
  } = $props();

  function addEntry() {
    entries = [...entries, { key: '', value: '' }];
  }

  function removeEntry(index) {
    entries = entries.filter((_, i) => i !== index);
    if (entries.length < minRows) {
      entries = [{ key: '', value: '' }];
    }
  }
</script>

<div class="space-y-2">
  {#each entries as entry, i}
    <div class="flex gap-2 items-center">
      <input
        type="text"
        class="input input-sm input-bordered flex-1 font-mono"
        bind:value={entry.key}
        placeholder={keyLabel}
        {disabled}
      />
      <input
        type="text"
        class="input input-sm input-bordered flex-1 font-mono"
        bind:value={entry.value}
        placeholder={valueLabel}
        {disabled}
      />
      <button
        class="btn btn-sm btn-ghost btn-square"
        onclick={() => removeEntry(i)}
        {disabled}
        title="Remove entry"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-4 h-4"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  {/each}
  <button
    class="btn btn-sm btn-outline w-full"
    onclick={addEntry}
    {disabled}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-4 h-4"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
    {addButtonLabel}
  </button>
</div>
