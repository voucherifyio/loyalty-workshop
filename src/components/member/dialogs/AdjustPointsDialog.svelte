<script>
  import BaseModal from '../../shared/BaseModal.svelte';
  import ModalHeader from '../../shared/ModalHeader.svelte';
  import ModalFooter from '../../shared/ModalFooter.svelte';

  let {
    open = false,
    selectedCard = null,
    adjustPointsValue = $bindable(''),
    adjustPointsReason = $bindable(''),
    adjusting = false,
    onConfirm,
    onClose,
  } = $props();

  const subtitle = $derived(
    selectedCard
      ? `Card: ${selectedCard.code || selectedCard.id} · Balance: ${selectedCard.balance?.points ?? 0} pts`
      : ''
  );
</script>

<BaseModal {open} size="md" {onClose}>
  <ModalHeader
    title="Adjust Points"
    {subtitle}
    {onClose}
    disabled={adjusting}
  />

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

  <ModalFooter
    confirmLabel="Apply"
    loading={adjusting}
    confirmDisabled={!adjustPointsValue}
    onCancel={onClose}
    onConfirm={onConfirm}
  />
</BaseModal>
