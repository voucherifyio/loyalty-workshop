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
    onOrderSelected = (orderRef, createdOrderId) => {},
  } = $props();

  // Order input state
  let orderMode = $state('reference');
  let orderRefType = $state('id');
  let orderRefValue = $state('');
  let orderAmount = $state('');
  let createMode = $state('simple');
  let orderItems = $state([]);
  let submitting = $state(false);
  let error = $state(null);

  function reset() {
    orderMode = 'reference';
    orderRefType = 'id';
    orderRefValue = '';
    orderAmount = '';
    createMode = 'simple';
    orderItems = [];
    submitting = false;
    error = null;
  }

  function isValid() {
    if (orderMode === 'reference') {
      return orderRefValue.trim().length > 0;
    } else if (createMode === 'simple') {
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

  async function handleConfirm() {
    if (!isValid()) return;

    submitting = true;
    error = null;

    try {
      let orderRef;
      let createdOrderId = null;

      if (orderMode === 'create') {
        const orderPayload = buildPaidOrderPayload({ customerId, createMode, orderAmount, orderItems });
        const orderResponse = await api.post(endpoints.orders.create(), orderPayload);
        createdOrderId = orderResponse.id;
        orderRef = { id: createdOrderId };
        toast.success(`Order created: ${createdOrderId}`);
      } else {
        // Reference existing order
        orderRef = { [orderRefType]: orderRefValue.trim() };
      }

      // Return the order reference to parent
      onOrderSelected(orderRef, createdOrderId);
      reset();
      onClose();
    } catch (err) {
      error = err.message || 'Failed to process order';
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

  const confirmLabel = $derived(orderMode === 'create' ? 'Create Order & Continue' : 'Select Order');
</script>

<BaseModal {open} size="md" onClose={handleClose}>
  {#snippet children()}
    <ModalHeader
      title="Select or Create Order"
      onClose={handleClose}
      disabled={submitting}
    />

    <div class="space-y-4">
      <OrderInputForm
        bind:mode={orderMode}
        {customerId}
        bind:orderRefType
        bind:orderRefValue
        bind:orderAmount
        bind:createMode
        bind:orderItems
      />

      {#if error}
        <AlertBanner variant="error" title="Error">
          {#snippet children()}
            <pre class="text-xs mt-1">{error}</pre>
          {/snippet}
        </AlertBanner>
      {/if}
    </div>

    <ModalFooter
      {confirmLabel}
      loading={submitting}
      confirmDisabled={!isValid()}
      onCancel={handleClose}
      onConfirm={handleConfirm}
    />
  {/snippet}
</BaseModal>
