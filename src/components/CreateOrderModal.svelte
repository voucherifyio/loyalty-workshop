<script>
  import { api } from '../api/client.js';
  import { endpoints } from '../api/endpoints.js';
  import { toast } from '../services/toast.js';
  import OrderInputForm from './OrderInputForm.svelte';
  import BaseModal from './shared/BaseModal.svelte';
  import ModalHeader from './shared/ModalHeader.svelte';
  import ModalFooter from './shared/ModalFooter.svelte';
  import AlertBanner from './shared/AlertBanner.svelte';
  import { buildPaidOrderPayload } from '../utils/orderPayload.js';

  let {
    open = false,
    customerId = '',
    onClose = () => {},
    onSuccess = () => {}
  } = $props();

  // Order creation state
  let orderMode = $state('create'); // Always create mode
  let orderRefType = $state('id');
  let orderRefValue = $state('');
  let orderAmount = $state('');
  let createMode = $state('simple');
  let orderItems = $state([]);
  let submitting = $state(false);
  let error = $state(null);

  function reset() {
    orderAmount = '';
    createMode = 'simple';
    orderItems = [];
    submitting = false;
    error = null;
  }

  function isValid() {
    if (createMode === 'simple') {
      const amount = parseInt(orderAmount);
      return !isNaN(amount) && amount > 0 && customerId;
    } else {
      // Items mode validation
      if (!customerId || orderItems.length === 0) return false;
      return orderItems.every(item => {
        const price = parseInt(item.price);
        const quantity = parseInt(item.quantity);
        return !isNaN(price) && price > 0 && !isNaN(quantity) && quantity > 0;
      });
    }
  }

  async function handleSubmit() {
    if (!isValid()) return;

    submitting = true;
    error = null;

    try {
      const orderPayload = buildPaidOrderPayload({ customerId, createMode, orderAmount, orderItems });
      const orderResponse = await api.post(endpoints.orders.create(), orderPayload);
      toast.success(`Order created: ${orderResponse.id}`);
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      error = err.message || 'Failed to create order';
      toast.error(error);
    } finally {
      submitting = false;
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  $effect(() => {
    if (open) {
      reset();
    }
  });

  const subtitle = $derived(`Customer: ${customerId}`);
</script>

<BaseModal {open} size="md" onClose={handleClose}>
  <ModalHeader
    title="Create Order"
    {subtitle}
    onClose={handleClose}
    disabled={submitting}
  />

  <div class="space-y-4">
    <OrderInputForm
      bind:mode={orderMode}
      {customerId}
      hideModeSelector={true}
      bind:orderRefType
      bind:orderRefValue
      bind:orderAmount
      bind:createMode
      bind:orderItems
    />

    <AlertBanner variant="info" title="Earning Rules Trigger">
      <div class="text-sm">
        Creates a <code class="bg-base-300 px-1 py-0.5 rounded text-xs">PAID</code> order with <code class="bg-base-300 px-1 py-0.5 rounded text-xs">customer.order.paid</code> event to activate configured earning rules
      </div>
    </AlertBanner>

    {#if error}
      <AlertBanner variant="error" title="Error">
        <pre class="text-xs mt-1">{error}</pre>
      </AlertBanner>
    {/if}
  </div>

  <ModalFooter
    confirmLabel="Create Order"
    loading={submitting}
    confirmDisabled={!isValid()}
    onCancel={handleClose}
    onConfirm={handleSubmit}
  />
</BaseModal>
