<script>
  let {
    open = false,
    selectedCard = null,
    adjustPointsValue = $bindable(''),
    adjustPointsReason = $bindable(''),
    adjusting = false,
    onConfirm,
    onClose,
  } = $props();
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <!-- Header with close button -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-lg">Adjust Points</h3>
          {#if selectedCard}
            <p class="text-sm text-base-content/60 mt-1">
              Card: <span class="font-mono text-xs">{selectedCard.code || selectedCard.id}</span>
              · Balance: <span class="font-bold">{selectedCard.balance?.points ?? 0} pts</span>
            </p>
          {/if}
        </div>
        <button
          class="btn btn-sm btn-circle btn-ghost"
          onclick={onClose}
          disabled={adjusting}
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="card bg-base-200 p-4">
        <div class="space-y-4">
          <div class="form-control">
            <label class="label" for="adjust-points-value">
              <span class="label-text font-medium">Points</span>
              <span class="label-text-alt text-base-content/50">Use negative to subtract</span>
            </label>
            <input
              id="adjust-points-value"
              type="number"
              class="input input-bordered"
              bind:value={adjustPointsValue}
              placeholder="e.g., 100 or -50"
            />
          </div>
          <div class="form-control">
            <label class="label" for="adjust-points-reason">
              <span class="label-text font-medium">Reason</span>
              <span class="label-text-alt text-base-content/50">Optional</span>
            </label>
            <input
              id="adjust-points-reason"
              type="text"
              class="input input-bordered"
              bind:value={adjustPointsReason}
              placeholder="Manual adjustment"
            />
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" onclick={onClose} disabled={adjusting}>Cancel</button>
        <button
          class="btn btn-primary"
          onclick={onConfirm}
          disabled={adjusting || !adjustPointsValue}
        >
          {#if adjusting}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            Apply
          {/if}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={onClose}>close</button>
    </form>
  </dialog>
{/if}
