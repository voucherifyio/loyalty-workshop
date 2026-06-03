<script>
  import BaseModal from '../../shared/BaseModal.svelte';
  import ModalHeader from '../../shared/ModalHeader.svelte';
  import ModalFooter from '../../shared/ModalFooter.svelte';
  import FormField from '../../shared/FormField.svelte';

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

<BaseModal {open} size="sm" {onClose}>
  <ModalHeader
    title="Refund Reward Purchase"
    subtitle={txId}
    {onClose}
    disabled={!!processing}
  />

  <div class="space-y-4">
    <FormField label="Refund Policy" for="refund-policy-refund">
      <select id="refund-policy-refund" class="select select-bordered select-sm" bind:value={refundPolicyRefund}>
        <option value="DEFAULT">DEFAULT — use reward's configured refundability</option>
        <option value="ALLOW">ALLOW — force allow even if reward is non-refundable</option>
      </select>
    </FormField>

    <FormField label="Stock Policy" for="refund-policy-stock">
      <select id="refund-policy-stock" class="select select-bordered select-sm" bind:value={refundPolicyStock}>
        <option value="DEFAULT">DEFAULT — return item back to assignment stock</option>
        <option value="WRITE_OFF">WRITE_OFF — do not return item to stock</option>
      </select>
    </FormField>
  </div>

  <ModalFooter
    confirmLabel="Confirm Refund"
    variant="warning"
    loading={!!processing}
    onCancel={onClose}
    onConfirm={onConfirm}
  />
</BaseModal>
