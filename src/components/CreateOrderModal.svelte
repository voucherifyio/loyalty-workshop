<script>
  import { api } from '../api/client.js';
  import { endpoints } from '../api/endpoints.js';
  import { toast } from '../services/toast.js';

  let {
    open = false,
    customerId = '',
    onClose = () => {},
    onSuccess = () => {}
  } = $props();

  let submitting = $state(false);
  let orderAmount = $state('');

  function resetForm() {
    orderAmount = '';
  }

  async function handleSubmit() {
    if (!orderAmount || isNaN(parseInt(orderAmount))) {
      toast.error('Please enter a valid order amount');
      return;
    }

    submitting = true;
    try {
      const payload = {
        customer_id: customerId,
        amount: parseInt(orderAmount),
        status: 'PAID'
      };

      await api.post(endpoints.orders.create(), payload);
      toast.success('Order created successfully');
      resetForm();
      onSuccess();
      onClose();
    } catch {
      toast.error('Failed to create order');
    } finally {
      submitting = false;
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-xl">
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

      <div class="card bg-base-200 p-4">
        <div class="space-y-4">
          <input
            type="number"
            class="input input-bordered w-full"
            bind:value={orderAmount}
            placeholder="Order amount (e.g., 1000 for $10.00)"
            min="0"
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
        </div>
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
          disabled={submitting}
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
