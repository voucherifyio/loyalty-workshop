<script>
  let {
    entries = $bindable([]),
    label = 'Metadata',
    keyPlaceholder = 'Key',
    valuePlaceholder = 'Value',
    disabled = false,
    onChange = () => {}
  } = $props();

  function addEntry() {
    entries = [...entries, { key: '', value: '' }];
    onChange();
  }

  function removeEntry(index) {
    entries = entries.filter((_, i) => i !== index);
    onChange();
  }

  function updateKey(index, newKey) {
    entries[index].key = newKey;
    onChange();
  }

  function updateValue(index, newValue) {
    entries[index].value = newValue;
    onChange();
  }
</script>

<div class="space-y-2">
  <div class="flex items-center justify-between">
    <label class="text-sm font-semibold">{label}</label>
    <button 
      type="button" 
      class="btn btn-xs btn-ghost" 
      onclick={addEntry}
      {disabled}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Add
    </button>
  </div>

  {#if entries.length === 0}
    <div class="alert alert-info text-xs py-2">
      <span>No {label.toLowerCase()} entries. Click "Add" to create one.</span>
    </div>
  {:else}
    <div class="space-y-2">
      {#each entries as entry, i (i)}
        <div class="flex gap-2 items-start">
          <input
            type="text"
            class="input input-sm input-bordered flex-1 font-mono text-xs"
            placeholder={keyPlaceholder}
            value={entry.key}
            oninput={(e) => updateKey(i, e.target.value)}
            {disabled}
          />
          <input
            type="text"
            class="input input-sm input-bordered flex-1 font-mono text-xs"
            placeholder={valuePlaceholder}
            value={entry.value}
            oninput={(e) => updateValue(i, e.target.value)}
            {disabled}
          />
          <button
            type="button"
            class="btn btn-sm btn-ghost btn-circle"
            onclick={() => removeEntry(i)}
            {disabled}
            title="Remove entry"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
