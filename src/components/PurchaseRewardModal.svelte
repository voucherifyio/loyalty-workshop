<script>
  import { api } from '../api/client.js';
  import { endpoints } from '../api/endpoints.js';
  import { toast } from '../services/toast.js';
  import BaseModal from './shared/BaseModal.svelte';
  import ModalHeader from './shared/ModalHeader.svelte';
  import AlertBanner from './shared/AlertBanner.svelte';
  import JsonDisplay from './shared/JsonDisplay.svelte';

  let {
    open = false,
    card = null,
    programId = '',
    memberId = '',
    rewardId = null,
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
      if (rewardId) {
        selectedRewardId = rewardId;
      }
    }
  });

  const isPreselected = $derived(rewardId != null);
  const selectedReward = $derived(rewards.find(r => r.reward_id === selectedRewardId) || null);
  const subtitle = $derived(
    card
      ? `Card: ${card.code || card.id}${card.balance ? ` · Balance: ${card.balance.points} pts` : ''}`
      : ''
  );
  const confirmLabel = $derived(dryRun ? 'Simulate' : 'Purchase');
</script>

<BaseModal {open} size="md" onClose={handleClose}>
  <ModalHeader
    title="Purchase Reward"
    {subtitle}
    onClose={handleClose}
    disabled={submitting}
  />

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
          <AlertBanner variant="warning">
            <span class="text-sm">No rewards assigned to this program.</span>
          </AlertBanner>
        {:else}
          <select
            id="reward-select"
            class="select select-bordered select-sm"
            bind:value={selectedRewardId}
            disabled={isPreselected}
          >
            <option value="">-- Select a reward --</option>
            {#each rewards as reward (reward.reward_id)}
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
              <div><strong>Costs:</strong> <JsonDisplay data={selectedReward.costs} size="xs" maxHeight="max-h-40" /></div>
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
        <AlertBanner variant="error" title="Error">
          <pre class="text-xs mt-1">{error}</pre>
        </AlertBanner>
      {/if}
    </div>
  {:else}
    <!-- Result -->
    <div class="space-y-3">
      <AlertBanner variant={dryRun ? 'info' : 'success'} title={dryRun ? 'Dry Run Result' : 'Purchase Initiated'}>
        {#if !dryRun}
          <p class="text-xs">The reward purchase is being processed asynchronously. Check the PURCHASES column for status updates.</p>
        {/if}
      </AlertBanner>
      <div>
        <div class="text-xs font-bold mb-1">Response:</div>
        <JsonDisplay data={result} />
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
        {:else}
          {confirmLabel}
        {/if}
      </button>
    {/if}
  </div>
</BaseModal>
