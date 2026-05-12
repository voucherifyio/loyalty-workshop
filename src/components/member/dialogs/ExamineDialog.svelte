<script>
  let {
    open = false,
    memberId = null,
    examineAmount = $bindable(''),
    examineResult = $bindable(null),
    examineError = $bindable(null),
    examineSubmitting = false,
    examineJsonExpanded = $bindable(false),
    onConfirm,
    onClose,
    onRunAgain,
  } = $props();
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-lg">
      <h3 class="font-bold text-lg mb-1">Examine Earnings</h3>
      <p class="text-xs text-base-content/50 mb-4">
        Simulates how many points this member would earn from a <code class="bg-base-200 px-1 rounded">customer.order.paid</code> event.
        Identified as member <span class="font-mono">{memberId}</span>.
      </p>

      {#if !examineResult}
        <div class="space-y-3">
          <div class="form-control">
            <label class="label" for="examine-amount">
              <span class="label-text">Order Amount <span class="text-base-content/40">(in cents, e.g. 1000 = $10.00)</span></span>
            </label>
            <input
              id="examine-amount"
              type="number"
              class="input input-bordered"
              bind:value={examineAmount}
              placeholder="e.g., 5000"
              min="1"
            />
          </div>
          {#if examineError}
            <div class="alert alert-error text-sm"><span>{examineError}</span></div>
          {/if}
        </div>
      {:else}
        <div class="space-y-4">
          <div class="alert alert-success text-sm"><span>Examination complete — {examineResult.memberships?.length ?? 0} membership(s) found</span></div>

          {#each examineResult.memberships ?? [] as membership}
            <div class="bg-base-200 rounded-xl p-3 space-y-2">
              <div class="flex items-center gap-2 text-xs text-base-content/60">
                <span class="font-semibold text-base-content">{membership.program?.name || membership.program?.id || 'Program'}</span>
                <span class="font-mono text-[10px]">{membership.program?.id}</span>
              </div>
              {#if membership.cards?.length}
                <div class="space-y-1">
                  {#each membership.cards as c}
                    <div class="flex items-center justify-between bg-base-100 rounded-lg px-3 py-2">
                      <span class="font-mono text-xs text-base-content/70">{c.card?.code || c.card?.id || '–'}</span>
                      <span class="font-bold text-primary text-sm">+{c.points_estimation ?? 0} pts</span>
                    </div>
                  {/each}
                </div>
              {/if}
              {#if membership.incentives?.length}
                <p class="text-[10px] text-base-content/50">Incentives: {membership.incentives.map(i => i.name || i.id).join(', ')}</p>
              {/if}
            </div>
          {/each}

          <div>
            <button
              class="btn btn-ghost btn-xs w-full"
              onclick={() => { examineJsonExpanded = !examineJsonExpanded; }}
            >
              {examineJsonExpanded ? 'Hide' : 'Show'} raw JSON
            </button>
            {#if examineJsonExpanded}
              <pre class="text-[9px] mt-2 p-2 bg-base-200 rounded overflow-x-auto max-h-60">{JSON.stringify(examineResult, null, 2)}</pre>
            {/if}
          </div>
        </div>
      {/if}

      <div class="modal-action">
        <button class="btn btn-ghost" onclick={onClose} disabled={examineSubmitting}>Close</button>
        {#if examineResult}
          <button class="btn btn-outline btn-sm" onclick={onRunAgain}>Run Again</button>
        {:else}
          <button
            class="btn btn-info"
            onclick={onConfirm}
            disabled={examineSubmitting || !examineAmount || parseInt(examineAmount) <= 0}
          >
            {#if examineSubmitting}
              <span class="loading loading-spinner loading-sm"></span>
            {:else}
              Examine
            {/if}
          </button>
        {/if}
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={onClose}>close</button>
    </form>
  </dialog>
{/if}
