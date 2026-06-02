<script>
  import { api } from '../api/client.js';
  import { endpoints } from '../api/endpoints.js';
  import { toast } from '../services/toast.js';
  import OrderSelectionModal from './OrderSelectionModal.svelte';

  let {
    open = false,
    card = null,
    member = null,
    programId = '',
    memberId = '',
    onClose = () => {},
    onSuccess = () => {}
  } = $props();

  // Order selection state
  let orderSelectionOpen = $state(false);
  let selectedOrderRef = $state(null);
  let createdOrderId = $state(null);

  // Payment limit
  let paymentLimitType = $state('CARD_BALANCE'); // 'CARD_BALANCE' | 'POINTS_LIMIT' | 'AMOUNT_LIMIT'
  let pointsLimitMax = $state('');
  let amountLimitMax = $state('');

  let dryRun = $state(false);
  let submitting = $state(false);
  let result = $state(null);
  let error = $state(null);

  function reset() {
    selectedOrderRef = null;
    createdOrderId = null;
    paymentLimitType = 'CARD_BALANCE';
    pointsLimitMax = '';
    amountLimitMax = '';
    dryRun = false;
    result = null;
    error = null;
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleOrderSelected(orderRef, orderId) {
    selectedOrderRef = orderRef;
    createdOrderId = orderId;
  }

  function openOrderSelection() {
    orderSelectionOpen = true;
  }

  function clearOrderSelection() {
    selectedOrderRef = null;
    createdOrderId = null;
  }

  function buildPaymentLimit() {
    if (paymentLimitType === 'CARD_BALANCE') {
      return { type: 'CARD_BALANCE' };
    }
    if (paymentLimitType === 'POINTS_LIMIT') {
      const max = parseInt(pointsLimitMax);
      if (isNaN(max) || max <= 0) return null;
      return { type: 'POINTS_LIMIT', points_limit: { max } };
    }
    if (paymentLimitType === 'AMOUNT_LIMIT') {
      const max = parseInt(amountLimitMax);
      if (isNaN(max) || max <= 0) return null;
      return { type: 'AMOUNT_LIMIT', amount_limit: { max } };
    }
    return null;
  }

  function isValid() {
    if (!selectedOrderRef) return false;
    if (paymentLimitType === 'POINTS_LIMIT') {
      const v = parseInt(pointsLimitMax);
      if (isNaN(v) || v <= 0) return false;
    }
    if (paymentLimitType === 'AMOUNT_LIMIT') {
      const v = parseInt(amountLimitMax);
      if (isNaN(v) || v <= 0) return false;
    }
    return true;
  }

  function getOrderDisplayText() {
    if (!selectedOrderRef) return null;
    if (createdOrderId) {
      return `Created Order: ${createdOrderId}`;
    }
    if (selectedOrderRef.id) {
      return `Order ID: ${selectedOrderRef.id}`;
    }
    if (selectedOrderRef.source_id) {
      return `Source ID: ${selectedOrderRef.source_id}`;
    }
    return 'Order selected';
  }

  async function handleSubmit() {
    if (!isValid() || !card) return;

    submitting = true;
    result = null;
    error = null;

    try {
      const body = {
        card_id: card.id,
        order: selectedOrderRef
      };

      const paymentLimit = buildPaymentLimit();
      if (paymentLimit && paymentLimit.type !== 'CARD_BALANCE') {
        body.payment_limit = paymentLimit;
      }

      if (dryRun) {
        body.mode = 'DRY_RUN';
      }

      const response = await api.post(
        endpoints.members.createOrderPayment(programId, memberId),
        body
      );
      result = response;
      
      if (dryRun) {
        toast.success('Dry run simulation complete');
      } else {
        toast.success('Order payment initiated');
        onSuccess();
      }
    } catch (err) {
      error = err.message || 'Failed to create order payment';
      toast.error(error);
    } finally {
      submitting = false;
    }
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
      <!-- Header with close button -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-lg">Pay With Points</h3>
          {#if card}
            <p class="text-sm text-base-content/60 mt-1">
              Card: <span class="font-mono text-xs">{card.code || card.id}</span>
              · Balance: <span class="font-bold">{card.balance?.points || 0} pts</span>
            </p>
          {/if}
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

      {#if !result}
        <div class="space-y-4">
          <!-- Order Selection Card -->
          <div class="card bg-base-200 p-4">
            <label class="label">
              <span class="label-text font-medium">Order</span>
            </label>
            {#if selectedOrderRef}
              <div class="flex gap-2">
                <div class="flex-1 bg-base-300 rounded-lg p-3">
                  <p class="text-xs font-semibold text-base-content/70">
                    {getOrderDisplayText()}
                  </p>
                  {#if createdOrderId}
                    <p class="text-[10px] text-success mt-1">New order created</p>
                  {/if}
                </div>
                <button
                  class="btn btn-sm btn-square btn-ghost"
                  onclick={clearOrderSelection}
                  title="Clear selection"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            {:else}
              <button class="btn btn-outline btn-block" onclick={openOrderSelection}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Select or Create Order
              </button>
            {/if}
          </div>

          <!-- Payment Limit Card -->
          <div class="card bg-base-200 p-4">
            <div class="space-y-3">
              <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
                <span class="text-sm text-base-content/70">Payment Limit</span>
                <select
                  id="payment-limit-type"
                  class="select select-bordered select-sm"
                  bind:value={paymentLimitType}
                >
                  <option value="CARD_BALANCE">Card Balance</option>
                  <option value="POINTS_LIMIT">Points Limit</option>
                  <option value="AMOUNT_LIMIT">Amount Limit</option>
                </select>
              </div>

              {#if paymentLimitType === 'POINTS_LIMIT'}
                <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
                  <span class="text-sm text-base-content/70">Max Points</span>
                  <input
                    id="points-limit-max"
                    type="number"
                    class="input input-bordered input-sm"
                    bind:value={pointsLimitMax}
                    placeholder="e.g., 200"
                    min="1"
                  />
                </div>
              {/if}

              {#if paymentLimitType === 'AMOUNT_LIMIT'}
                <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
                  <span class="text-sm text-base-content/70">Max Amount</span>
                  <div class="space-y-1">
                    <input
                      id="amount-limit-max"
                      type="number"
                      class="input input-bordered input-sm w-full"
                      bind:value={amountLimitMax}
                      placeholder="e.g., 1000"
                      min="1"
                    />
                    <p class="text-xs text-base-content/50">Amount in cents (e.g., 1000 = $10.00)</p>
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Dry Run Card -->
          <div class="card bg-base-200 p-4">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                class="toggle toggle-sm toggle-primary"
                bind:checked={dryRun}
              />
              <div>
                <span class="label-text font-medium">Dry Run</span>
                <p class="text-[10px] text-base-content/60">Simulate the payment without creating a real transaction</p>
              </div>
            </label>
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
      {:else}
        <!-- Result -->
        <div class="space-y-3">
          <div class="alert {dryRun ? 'alert-info' : 'alert-success'}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <div class="font-bold text-sm">{dryRun ? 'Dry Run Result' : 'Payment Initiated'}</div>
              {#if createdOrderId}
                <p class="text-xs mt-1">
                  Order: <span class="font-mono">{createdOrderId}</span>
                </p>
              {/if}
              {#if dryRun && result?.details}
                <p class="text-xs mt-1">
                  Would spend <strong>{result.details?.payment?.points_spent || 0} pts</strong>
                  {#if result.details?.payment?.amount}
                    covering <strong>${(result.details.payment.amount / 100).toFixed(2)}</strong>
                  {/if}
                </p>
              {:else if !dryRun}
                <p class="text-xs mt-1">The payment is being processed asynchronously. Check ORDER PAYMENTS for status updates.</p>
              {/if}
            </div>
          </div>
          <div>
            <div class="text-xs font-bold mb-1">Response:</div>
            <pre class="text-[10px] bg-base-200 p-3 rounded overflow-x-auto max-h-60">{JSON.stringify(result, null, 2)}</pre>
          </div>
          {#if dryRun}
            <button
              class="btn btn-sm btn-ghost w-full"
              onclick={() => { result = null; dryRun = false; }}
            >
              Proceed with real payment
            </button>
          {/if}
        </div>
      {/if}

      <div class="modal-action">
        <button class="btn btn-ghost" onclick={handleClose} disabled={submitting}>
          {result && !dryRun ? 'Close' : 'Cancel'}
        </button>
        {#if !result}
          <button
            class="btn btn-primary"
            onclick={handleSubmit}
            disabled={submitting || !isValid()}
          >
            {#if submitting}
              <span class="loading loading-spinner loading-sm"></span>
            {:else if dryRun}
              Simulate
            {:else}
              Pay With Points
            {/if}
          </button>
        {/if}
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={handleClose}>close</button>
    </form>
  </dialog>
{/if}

<!-- Order Selection Modal -->
<OrderSelectionModal
  open={orderSelectionOpen}
  customerId={member?.customer_id || ''}
  onClose={() => { orderSelectionOpen = false; }}
  onOrderSelected={handleOrderSelected}
/>
