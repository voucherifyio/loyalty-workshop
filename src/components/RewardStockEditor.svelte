<script>
  let {
    rewardId = '',
    existingStock = null,
    onConfirm = () => {},
    onClose = () => {},
  } = $props();

  let stockType = $state(existingStock?.type ?? 'UNLIMITED');
  let quantity = $state(existingStock?.limited?.quantity ?? 0);

  const canConfirm = $derived(stockType === 'UNLIMITED' || (stockType === 'LIMITED' && quantity > 0));

  function handleConfirm() {
    if (!canConfirm) return;
    const stockData = { type: stockType };
    if (stockType === 'LIMITED') {
      stockData.limited = { quantity };
    }
    onConfirm(stockData);
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
  aria-label="Reward stock configuration"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  tabindex="-1"
>
  <div class="card bg-base-100 shadow-2xl w-96 max-w-full">
    <div class="card-body p-5 space-y-4">
      <div>
        <h3 class="font-bold text-base">Configure Reward Stock</h3>
        <p class="text-xs text-base-content/50 font-mono mt-0.5">{rewardId}</p>
      </div>

      <div class="space-y-3">
        <div class="form-control">
          <label class="label py-0.5">
            <span class="label-text text-xs font-semibold">Stock Type</span>
          </label>
          <div class="space-y-2">
            <label class="label cursor-pointer justify-start gap-3 py-2 hover:bg-base-200/50 rounded-lg px-3">
              <input
                type="radio"
                name="stock-type"
                class="radio radio-sm radio-primary"
                value="UNLIMITED"
                bind:group={stockType}
              />
              <span class="label-text">
                <span class="font-semibold">Unlimited</span>
                <span class="text-xs text-base-content/60 block">No stock restrictions</span>
              </span>
            </label>

            <label class="label cursor-pointer justify-start gap-3 py-2 hover:bg-base-200/50 rounded-lg px-3">
              <input
                type="radio"
                name="stock-type"
                class="radio radio-sm radio-primary"
                value="LIMITED"
                bind:group={stockType}
              />
              <span class="label-text">
                <span class="font-semibold">Limited</span>
                <span class="text-xs text-base-content/60 block">Specify available quantity</span>
              </span>
            </label>
          </div>
        </div>

        {#if stockType === 'LIMITED'}
          <div class="form-control">
            <label class="label py-0.5">
              <span class="label-text text-xs font-semibold">Quantity</span>
            </label>
            <input
              type="number"
              class="input input-sm input-bordered w-full font-mono"
              placeholder="Enter quantity"
              bind:value={quantity}
              min="1"
            />
          </div>
        {/if}
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
