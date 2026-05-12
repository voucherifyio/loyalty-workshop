<script>
  let {
    cardDefId = '',
    cardName = '',
    tierStructures = [],
    onApply = () => {},
    onCancel = () => {},
  } = $props();

  let selectedTierId = $state('__skip__');

  $effect(() => {
    selectedTierId =
      tierStructures.length === 1 ? tierStructures[0].id : '__skip__';
  });

  function typeLabel(type) {
    if (type === 'POINT_BALANCE') return 'Balance';
    if (type === 'POINT_EARNED') return 'Earned';
    return type || '–';
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel();
  }

  function handleApply() {
    onApply(selectedTierId === '__skip__' ? null : selectedTierId);
  }
</script>

<div
  class="fixed inset-0 z-60 flex items-center justify-center bg-black/30 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  aria-label="Choose tier structure for program"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && onCancel()}
  tabindex="-1"
>
  <div class="card bg-base-100 shadow-2xl w-[min(100%,28rem)] max-w-full max-h-[90vh] overflow-y-auto">
    <div class="card-body p-5 space-y-4">
      <div>
        <h3 class="font-bold text-base">Assign tier structure</h3>
        <p class="text-xs text-base-content/60 mt-1">
          This wallet has tier structure(s). Only one tier structure can be assigned per program — pick one or skip.
        </p>
        <p class="text-xs font-mono text-base-content/50 mt-1 break-all">{cardName || cardDefId}</p>
      </div>

      <div class="space-y-2">
        <label class="flex items-start gap-2 cursor-pointer rounded-lg border border-base-300 p-2 hover:bg-base-200/50">
          <input
            type="radio"
            class="radio radio-sm radio-primary mt-0.5 shrink-0"
            name="tier-structure-assign"
            value="__skip__"
            bind:group={selectedTierId}
          />
          <span class="text-sm">
            <span class="font-medium">Wallet only</span>
            <span class="block text-xs text-base-content/50">Do not assign a tier structure now</span>
          </span>
        </label>

        {#each tierStructures as ts}
          <label class="flex items-start gap-2 cursor-pointer rounded-lg border border-base-300 p-2 hover:bg-base-200/50">
            <input
              type="radio"
              class="radio radio-sm radio-primary mt-0.5 shrink-0"
              name="tier-structure-assign"
              value={ts.id}
              bind:group={selectedTierId}
            />
            <span class="text-sm min-w-0 flex-1">
              <span class="font-medium">{ts.name || ts.id}</span>
              {#if ts.type}
                <span class="badge badge-xs badge-ghost font-mono ml-1">{typeLabel(ts.type)}</span>
              {/if}
              <span class="block text-[10px] font-mono text-base-content/40 truncate">{ts.id}</span>
            </span>
          </label>
        {/each}
      </div>

      <div class="flex justify-end flex-wrap gap-2 pt-1">
        <button type="button" class="btn btn-ghost btn-sm" onclick={onCancel}>
          Cancel
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick={handleApply}>
          Continue
        </button>
      </div>
    </div>
  </div>
</div>
