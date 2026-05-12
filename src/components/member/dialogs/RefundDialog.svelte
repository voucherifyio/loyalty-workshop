<script>
  let {
    open = false,
    txId = null,
    refundPolicyRefund = $bindable('DEFAULT'),
    refundPolicyStock = $bindable('DEFAULT'),
    processing = false,
    onConfirm,
    onClose,
  } = $props();
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-sm">
      <h3 class="font-bold text-lg mb-1">Refund Reward Purchase</h3>
      <p class="text-xs text-base-content/50 mb-4 font-mono break-all">{txId}</p>
      <div class="space-y-4">
        <div class="form-control">
          <label class="label" for="refund-policy-refund">
            <span class="label-text">Refund Policy</span>
          </label>
          <select id="refund-policy-refund" class="select select-bordered select-sm" bind:value={refundPolicyRefund}>
            <option value="DEFAULT">DEFAULT — use reward's configured refundability</option>
            <option value="ALLOW">ALLOW — force allow even if reward is non-refundable</option>
          </select>
        </div>
        <div class="form-control">
          <label class="label" for="refund-policy-stock">
            <span class="label-text">Stock Policy</span>
          </label>
          <select id="refund-policy-stock" class="select select-bordered select-sm" bind:value={refundPolicyStock}>
            <option value="DEFAULT">DEFAULT — return item back to assignment stock</option>
            <option value="WRITE_OFF">WRITE_OFF — do not return item to stock</option>
          </select>
        </div>
      </div>
      <div class="modal-action">
        <button class="btn btn-ghost" onclick={onClose} disabled={!!processing}>Cancel</button>
        <button class="btn btn-warning" onclick={onConfirm} disabled={!!processing}>
          {#if processing}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            Confirm Refund
          {/if}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={onClose}>close</button>
    </form>
  </dialog>
{/if}
