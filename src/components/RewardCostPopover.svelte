<script>
  let {
    rewardId = '',
    cardDefinitions = [],
    existingCost = null,
    onConfirm = () => {},
    onClose = () => {},
  } = $props();

  let cardDefinitionId = $state(existingCost?.card_definition_id ?? cardDefinitions[0]?.id ?? '');
  let points = $state(existingCost?.points ?? 0);
  let stock = $state(existingCost?.stock ?? 0);

  const canConfirm = $derived(!!cardDefinitionId && points > 0);

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm({ card_definition_id: cardDefinitionId, points, stock });
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
</script>

<!-- Modal-style centered popover with backdrop -->
<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
  role="dialog"
  aria-modal="true"
  aria-label="Reward cost configuration"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  tabindex="-1"
>
  <div class="card bg-base-100 shadow-2xl w-96 max-w-full">
    <div class="card-body p-5 space-y-4">
      <div>
        <h3 class="font-bold text-base">Configure Reward Cost</h3>
        <p class="text-xs text-base-content/50 font-mono mt-0.5">{rewardId}</p>
      </div>

      <div class="space-y-3">
        <div class="form-control">
          <label class="label py-0.5">
            <span class="label-text text-xs font-semibold">Card Definition</span>
          </label>
          {#if cardDefinitions.length === 0}
            <p class="text-xs text-warning">No card definitions assigned to this program yet. Assign wallets first.</p>
          {:else}
            <select
              class="select select-sm select-bordered w-full font-mono"
              bind:value={cardDefinitionId}
            >
              <option value="">Select card definition...</option>
              {#each cardDefinitions as cd}
                <option value={cd.id}>{cd.name || cd.id}</option>
              {/each}
            </select>
          {/if}
        </div>

        <div class="flex gap-3">
          <div class="form-control flex-1">
            <label class="label py-0.5">
              <span class="label-text text-xs font-semibold">Points</span>
            </label>
            <input
              type="number"
              class="input input-sm input-bordered w-full font-mono"
              placeholder="0"
              bind:value={points}
              min="1"
            />
          </div>

          <div class="form-control flex-1">
            <label class="label py-0.5">
              <span class="label-text text-xs font-semibold">Stock (optional)</span>
            </label>
            <input
              type="number"
              class="input input-sm input-bordered w-full font-mono"
              placeholder="∞"
              bind:value={stock}
              min="0"
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-1">
        <button class="btn btn-ghost btn-sm" onclick={onClose}>
          Cancel
        </button>
        <button
          class="btn btn-primary btn-sm"
          onclick={handleConfirm}
          disabled={!canConfirm}
        >
          Confirm Assignment
        </button>
      </div>
    </div>
  </div>
</div>
