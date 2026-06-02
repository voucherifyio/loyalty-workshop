<script>
  import { api } from '../api/client.js';
  import { endpoints } from '../api/endpoints.js';
  import { toast } from '../services/toast.js';
  import OrderInputForm from './OrderInputForm.svelte';

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
        // Create the order
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
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <h3 class="font-bold text-lg mb-4">Select or Create Order</h3>

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
        <button class="btn btn-ghost" onclick={handleClose} disabled={submitting}>
          Cancel
        </button>
        <button
          class="btn btn-primary"
          onclick={handleConfirm}
          disabled={submitting || !isValid()}
        >
          {#if submitting}
            <span class="loading loading-spinner loading-sm"></span>
          {:else if orderMode === 'create'}
            Create Order & Continue
          {:else}
            Select Order
          {/if}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={handleClose}>close</button>
    </form>
  </dialog>
{/if}
