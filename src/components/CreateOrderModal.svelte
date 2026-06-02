<script>
  import { api } from '../api/client.js';
  import { endpoints } from '../api/endpoints.js';
  import { toast } from '../services/toast.js';
  import OrderInputForm from './OrderInputForm.svelte';

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
      // Build order payload
      const orderPayload = {
        customer_id: customerId,
        status: 'PAID'
      };

      if (createMode === 'simple') {
        orderPayload.amount = parseInt(orderAmount);
      } else {
        // Add items to the payload
        orderPayload.items = orderItems.map(item => {
          const itemData = {
            price: parseInt(item.price),
            quantity: parseInt(item.quantity),
            amount: parseInt(item.price) * parseInt(item.quantity)
          };
          if (item.product_id && item.product_id.trim()) {
            itemData.product_id = item.product_id.trim();
          }
          if (item.sku_id && item.sku_id.trim()) {
            itemData.sku_id = item.sku_id.trim();
          }
          return itemData;
        });
        // Calculate total amount from items
        orderPayload.amount = orderPayload.items.reduce((sum, item) => sum + item.amount, 0);
      }

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
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-lg">Create Order</h3>
          <p class="text-sm text-base-content/60 mt-1">
            Customer: <span class="font-mono text-xs">{customerId}</span>
          </p>
        </div>
        <button
          class="btn btn-sm btn-circle btn-ghost"
          onclick={handleClose}
          disabled={submitting}
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

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

        <div class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="text-sm">
            <div class="font-semibold mb-1">Earning Rules Trigger</div>
            <div>Creates a <code class="bg-base-300 px-1 py-0.5 rounded text-xs">PAID</code> order with <code class="bg-base-300 px-1 py-0.5 rounded text-xs">customer.order.paid</code> event to activate configured earning rules</div>
          </div>
        </div>

        {#if error}
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div class="flex-1">
              <div class="font-bold text-sm">Error</div>
              <pre class="text-xs mt-1">{error}</pre>
            </div>
          </div>
        {/if}
      </div>

      <div class="modal-action">
        <button
          class="btn btn-ghost"
          onclick={handleClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          onclick={handleSubmit}
          disabled={submitting || !isValid()}
        >
          {#if submitting}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            Create Order
          {/if}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={handleClose}>close</button>
    </form>
  </dialog>
{/if}
