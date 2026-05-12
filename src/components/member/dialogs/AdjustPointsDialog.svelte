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
    <div class="modal-box max-w-sm">
      <h3 class="font-bold text-lg mb-2">Adjust Points</h3>
      {#if selectedCard}
        <p class="text-sm text-base-content/70 mb-4">
          Card: <span class="font-mono">{selectedCard.code || selectedCard.id}</span>
          <span class="ml-2 text-base-content/50">Balance: <strong>{selectedCard.balance?.points ?? 0} pts</strong></span>
        </p>
      {/if}
      <div class="space-y-4">
        <div class="form-control">
          <label class="label" for="adjust-points-value">
            <span class="label-text">Points <span class="text-base-content/50">(use negative to subtract)</span></span>
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
            <span class="label-text">Reason <span class="text-base-content/50">(optional)</span></span>
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
