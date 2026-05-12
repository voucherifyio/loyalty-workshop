<script>
  import { api } from '../api/client.js';
  import { endpoints } from '../api/endpoints.js';
  import { toast } from '../services/toast.js';

  let {
    open = false,
    card = null,
    programId = '',
    memberId = '',
    onClose = () => {},
    onSuccess = () => {}
  } = $props();

  // Order reference
  let orderRefType = $state('id'); // 'id' | 'source_id'
  let orderRefValue = $state('');

  // Payment limit
  let paymentLimitType = $state('CARD_BALANCE'); // 'CARD_BALANCE' | 'POINTS_LIMIT' | 'AMOUNT_LIMIT'
  let pointsLimitMax = $state('');
  let amountLimitMax = $state('');

  let dryRun = $state(false);
  let submitting = $state(false);
  let result = $state(null);
  let error = $state(null);

  function reset() {
    orderRefType = 'id';
    orderRefValue = '';
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
    if (!orderRefValue.trim()) return false;
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

  async function handleSubmit() {
    if (!isValid() || !card) return;

    submitting = true;
    result = null;
    error = null;

    const body = {
      card_id: card.id,
      order: { [orderRefType]: orderRefValue.trim() }
    };

    const paymentLimit = buildPaymentLimit();
    if (paymentLimit && paymentLimit.type !== 'CARD_BALANCE') {
      body.payment_limit = paymentLimit;
    }

    if (dryRun) {
      body.mode = 'DRY_RUN';
    }

    try {
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
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-2">Pay With Points</h3>
      {#if card}
        <p class="text-sm text-base-content/70 mb-4">
          Card: <span class="font-mono">{card.code || card.id}</span>
          <span class="ml-2 text-base-content/50">Balance: <strong>{card.balance?.points || 0} pts</strong></span>
        </p>
      {/if}

      {#if !result}
        <div class="space-y-4">
          <!-- Order Reference -->
          <div class="form-control">
            <label class="label" for="order-ref-type">
              <span class="label-text">Order Reference</span>
            </label>
            <div class="join">
              <select
                id="order-ref-type"
                class="select select-bordered join-item"
                bind:value={orderRefType}
              >
                <option value="id">Order ID</option>
                <option value="source_id">Source ID</option>
              </select>
              <input
                type="text"
                class="input input-bordered join-item flex-1"
                bind:value={orderRefValue}
                placeholder={orderRefType === 'id' ? 'ord_...' : 'my_order_001'}
              />
            </div>
          </div>

          <!-- Payment Limit -->
          <div class="form-control">
            <label class="label" for="payment-limit-type">
              <span class="label-text">Payment Limit</span>
            </label>
            <select
              id="payment-limit-type"
              class="select select-bordered"
              bind:value={paymentLimitType}
            >
              <option value="CARD_BALANCE">Card Balance (spend all available points, up to order total)</option>
              <option value="POINTS_LIMIT">Points Limit (cap points spent)</option>
              <option value="AMOUNT_LIMIT">Amount Limit (cap monetary value covered)</option>
            </select>
          </div>

          {#if paymentLimitType === 'POINTS_LIMIT'}
            <div class="form-control">
              <label class="label" for="points-limit-max">
                <span class="label-text">Max Points to Spend</span>
              </label>
              <input
                id="points-limit-max"
                type="number"
                class="input input-bordered"
                bind:value={pointsLimitMax}
                placeholder="e.g., 200"
                min="1"
              />
            </div>
          {/if}

          {#if paymentLimitType === 'AMOUNT_LIMIT'}
            <div class="form-control">
              <label class="label" for="amount-limit-max">
                <span class="label-text">Max Amount Covered (in cents)</span>
                <span class="label-text-alt text-base-content/50">e.g., 1000 = $10.00</span>
              </label>
              <input
                id="amount-limit-max"
                type="number"
                class="input input-bordered"
                bind:value={amountLimitMax}
                placeholder="e.g., 1000"
                min="1"
              />
            </div>
          {/if}

          <!-- Dry Run Toggle -->
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                class="toggle toggle-sm toggle-primary"
                bind:checked={dryRun}
              />
              <div>
                <span class="label-text font-medium">Dry Run</span>
                <p class="text-[10px] text-base-content/60">Simulate the payment — shows how many points would be spent without creating a transaction</p>
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
