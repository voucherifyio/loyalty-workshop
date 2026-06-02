<script>
  import { api } from '../api/client.js';
  import { endpoints } from '../api/endpoints.js';
  import { toast } from '../services/toast.js';

  let {
    open = false,
    card = null,
    programId = '',
    memberId = '',
    rewardId = null, // Optional: pre-select a specific reward
    onClose = () => {},
    onSuccess = () => {}
  } = $props();

  let rewards = $state([]);
  let loadingRewards = $state(false);
  let selectedRewardId = $state('');
  let dryRun = $state(false);
  let submitting = $state(false);
  let result = $state(null);
  let error = $state(null);

  function reset() {
    selectedRewardId = rewardId || '';
    dryRun = false;
    result = null;
    error = null;
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function loadRewards() {
    if (!programId) return;

    loadingRewards = true;
    try {
      // programs.rewards returns reward assignment records (VLProgramRewardDTO)
      // each item has reward_id, costs, stock, redeemed — no name or status
      const response = await api.get(endpoints.programs.rewards(programId));
      rewards = response.data || [];
    } catch {
      rewards = [];
    } finally {
      loadingRewards = false;
    }
  }

  async function handleSubmit() {
    if (!selectedRewardId) return;

    submitting = true;
    result = null;
    error = null;

    const body = {
      reward_id: selectedRewardId
    };
    if (dryRun) {
      body.mode = 'DRY_RUN';
    }

    try {
      const response = await api.post(
        endpoints.members.purchaseReward(programId, memberId),
        body
      );
      result = response;
      if (dryRun) {
        toast.success('Dry run simulation complete');
      } else {
        toast.success('Reward purchase initiated');
        onSuccess();
      }
    } catch (err) {
      error = err.message || 'Failed to purchase reward';
      toast.error(error);
    } finally {
      submitting = false;
    }
  }

  $effect(() => {
    if (open && programId) {
      reset();
      loadRewards();
      // Pre-select reward if provided
      if (rewardId) {
        selectedRewardId = rewardId;
      }
    }
  });

  const isPreselected = $derived(rewardId != null);
  const selectedReward = $derived(rewards.find(r => r.reward_id === selectedRewardId) || null);
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <!-- Header with close button -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-lg">Purchase Reward</h3>
          {#if card}
            <p class="text-sm text-base-content/60 mt-1">
              Card: <span class="font-mono text-xs">{card.code || card.id}</span>
              {#if card.balance}
                · Balance: <span class="font-bold">{card.balance.points} pts</span>
              {/if}
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
          <!-- Reward Selection Card -->
          <div class="card bg-base-200 p-4">
            <label class="label" for="reward-select">
              <span class="label-text font-medium">Select Reward</span>
              {#if isPreselected}
                <span class="badge badge-info badge-sm">Pre-selected</span>
              {/if}
            </label>
            {#if loadingRewards}
              <div class="flex items-center gap-2 p-2">
                <span class="loading loading-spinner loading-sm"></span>
                <span class="text-sm">Loading rewards...</span>
              </div>
            {:else if rewards.length === 0}
              <div class="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div class="flex-1">
                  <span class="text-sm">No rewards assigned to this program.</span>
                </div>
              </div>
            {:else}
              <select
                id="reward-select"
                class="select select-bordered select-sm"
                bind:value={selectedRewardId}
                disabled={isPreselected}
              >
                <option value="">-- Select a reward --</option>
                {#each rewards as reward}
                  <option value={reward.reward_id}>{reward.reward_id}</option>
                {/each}
              </select>
            {/if}
          </div>

          <!-- Reward Details Card -->
          {#if selectedReward}
            <div class="card bg-base-200 p-4">
              <div class="space-y-2 text-xs">
                <div><strong>Reward ID:</strong> <span class="font-mono">{selectedReward.reward_id}</span></div>
                
                {#if selectedReward.stock}
                  <div>
                    <strong>Stock:</strong>
                    {#if selectedReward.stock.type === 'UNLIMITED'}
                      <span class="badge badge-success badge-xs ml-1">Unlimited</span>
                    {:else if selectedReward.stock.type === 'LIMITED'}
                      <span class="badge badge-warning badge-xs ml-1">
                        Limited: {selectedReward.stock.limited?.quantity ?? 0} available
                      </span>
                    {/if}
                    {#if selectedReward.redeemed != null}
                      <span class="ml-2 text-base-content/50">· Redeemed: {selectedReward.redeemed}</span>
                    {/if}
                  </div>
                {/if}
                
                {#if selectedReward.costs?.length}
                  <div><strong>Costs:</strong> <pre class="text-[10px] bg-base-300 p-1 rounded mt-1 overflow-x-auto">{JSON.stringify(selectedReward.costs, null, 2)}</pre></div>
                {/if}
              </div>
            </div>
          {/if}

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
                <p class="text-[10px] text-base-content/60">Simulate the purchase without creating a real transaction</p>
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
              <div class="font-bold text-sm">{dryRun ? 'Dry Run Result' : 'Purchase Initiated'}</div>
              {#if !dryRun}
                <p class="text-xs mt-1">The reward purchase is being processed asynchronously. Check the PURCHASES column for status updates.</p>
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
              Proceed with real purchase
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
            disabled={submitting || !selectedRewardId}
          >
            {#if submitting}
              <span class="loading loading-spinner loading-sm"></span>
            {:else if dryRun}
              Simulate
            {:else}
              Purchase
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
