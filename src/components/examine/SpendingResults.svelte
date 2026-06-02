<script>
  import { formatNum } from '../../utils/transactionFormatting.js';
  import PurchaseRewardModal from '../PurchaseRewardModal.svelte';

  let {
    results = null,
    groupBy = $bindable('card'), // 'card' | 'reward' | 'availability'
    programId = '',
    memberId = '',
    member = null, // Full member object with cards
    onRunAgain = () => {},
    onExport = () => {},
    onPurchaseSuccess = () => {}
  } = $props();

  let showJson = $state(false);
  let purchaseModalOpen = $state(false);
  let selectedCard = $state(null);
  let selectedRewardId = $state(null);

  // Enrich card with balance from member data
  function enrichCardWithBalance(card) {
    if (!member?.cards) return card;
    
    const memberCard = member.cards.find(c => c.id === card.id);
    if (memberCard?.balance) {
      return { ...card, balance: memberCard.balance };
    }
    return card;
  }

  function handlePurchaseClick(card, rewardId) {
    selectedCard = enrichCardWithBalance(card);
    selectedRewardId = rewardId;
    purchaseModalOpen = true;
  }

  function handlePurchaseSuccess() {
    purchaseModalOpen = false;
    onPurchaseSuccess();
  }

  // Get reward details from top-level rewards array
  function getRewardDetails(rewardId) {
    return results?.rewards?.find(r => r.id === rewardId) || { id: rewardId, name: rewardId };
  }

  // Transform results for grouping by card
  const byCard = $derived(() => {
    if (!results || !results.memberships?.[0]) return [];
    
    const membership = results.memberships[0];
    return membership.cards?.map(cardEst => ({
      card: cardEst.card,
      rewards: cardEst.rewards?.map(rewardEst => ({
        ...rewardEst,
        rewardDetails: getRewardDetails(rewardEst.reward.id)
      })) || []
    })) || [];
  });

  // Transform results for grouping by reward
  const byReward = $derived(() => {
    if (!results || !results.memberships?.[0]) return [];
    
    const membership = results.memberships[0];
    const rewardMap = new Map();

    membership.cards?.forEach(cardEst => {
      cardEst.rewards?.forEach(rewardEst => {
        if (!rewardMap.has(rewardEst.reward.id)) {
          rewardMap.set(rewardEst.reward.id, {
            rewardDetails: getRewardDetails(rewardEst.reward.id),
            cardEstimations: []
          });
        }
        const reward = rewardMap.get(rewardEst.reward.id);
        reward.cardEstimations.push({
          card: cardEst.card,
          ...rewardEst
        });
      });
    });

    return Array.from(rewardMap.values());
  });

  // Transform results for grouping by availability
  const byAvailability = $derived(() => {
    if (!results || !results.memberships?.[0]) return { available: [], unavailable: [] };
    
    const membership = results.memberships[0];
    const available = [];
    const unavailable = [];

    membership.cards?.forEach(cardEst => {
      cardEst.rewards?.forEach(rewardEst => {
        const item = {
          ...rewardEst,
          rewardDetails: getRewardDetails(rewardEst.reward.id),
          card: cardEst.card
        };
        if (rewardEst.status === 'AVAILABLE') {
          available.push(item);
        } else {
          unavailable.push(item);
        }
      });
    });

    return { available, unavailable };
  });

  function getUnavailabilityDisplay(reason) {
    switch (reason.reason) {
      case 'insufficient_balance':
        return {
          icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
          text: `Need ${formatNum(reason.details?.missing || 0)} more points`,
          class: 'alert-warning'
        };
      case 'out_of_stock':
        return {
          icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
          text: 'Out of stock',
          class: 'alert-error'
        };
      case 'no_matching_cost':
        return {
          icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
          text: 'Not eligible for this reward',
          class: 'alert-info'
        };
      case 'no_card_for_definition':
        return {
          icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
          text: 'No card for this reward',
          class: 'alert-info'
        };
      default:
        return {
          icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
          text: reason.reason,
          class: 'alert-info'
        };
    }
  }
</script>

{#if results}
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold">Reward Catalog</h3>
        <p class="text-sm text-base-content/60">Available rewards for redemption</p>
      </div>
      <div class="flex gap-2">
        <div class="join">
          <button
            class="btn btn-sm join-item {groupBy === 'card' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => (groupBy = 'card')}
          >
            By Card
          </button>
          <button
            class="btn btn-sm join-item {groupBy === 'reward' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => (groupBy = 'reward')}
          >
            By Reward
          </button>
          <button
            class="btn btn-sm join-item {groupBy === 'availability' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => (groupBy = 'availability')}
          >
            By Status
          </button>
        </div>
        <button class="btn btn-sm btn-outline" onclick={onExport}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export JSON
        </button>
        <button class="btn btn-sm btn-primary" onclick={onRunAgain}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Run Again
        </button>
      </div>
    </div>

    {#if groupBy === 'card'}
      <!-- Group by Card View -->
      <div class="space-y-4">
        {#each byCard() as cardData}
          <div class="bg-base-200 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-bold font-mono">{cardData.card.code || cardData.card.id}</h4>
                <p class="text-xs text-base-content/50">{cardData.card.card_definition_id}</p>
              </div>
              <div class="badge badge-lg">
                {cardData.rewards.filter(r => r.status === 'AVAILABLE').length} / {cardData.rewards.length} available
              </div>
            </div>

            {#if cardData.rewards.length > 0}
              <div class="space-y-2">
                {#each cardData.rewards as rewardEst}
                  <div class="bg-base-300 rounded p-3">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1">
                        <p class="font-semibold">{rewardEst.rewardDetails.name}</p>
                        <p class="text-xs text-base-content/50 font-mono">{rewardEst.reward.id}</p>
                      </div>
                      <div class="flex items-center gap-2">
                        {#if rewardEst.cost}
                          <span class="font-bold text-primary">{formatNum(rewardEst.cost.points)} pts</span>
                        {/if}
                        {#if rewardEst.status === 'AVAILABLE'}
                          <button
                            class="btn btn-xs btn-primary"
                            onclick={() => handlePurchaseClick(cardData.card, rewardEst.reward.id)}
                          >
                            Purchase
                          </button>
                          <div class="badge badge-success badge-sm">Available</div>
                        {:else}
                          <div class="badge badge-ghost badge-sm">Unavailable</div>
                        {/if}
                      </div>
                    </div>

                    {#if rewardEst.unavailability_reasons && rewardEst.unavailability_reasons.length > 0}
                      <div class="space-y-1 mt-2">
                        {#each rewardEst.unavailability_reasons as reason}
                          {@const display = getUnavailabilityDisplay(reason)}
                          <div class="alert {display.class} py-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 shrink-0">
                              <path stroke-linecap="round" stroke-linejoin="round" d={display.icon} />
                            </svg>
                            <span class="text-sm">{display.text}</span>
                            {#if reason.reason === 'insufficient_balance' && reason.details}
                              <div class="flex-1">
                                <progress class="progress progress-warning w-full" value={reason.details.available} max={reason.details.required}></progress>
                                <p class="text-xs mt-1">{formatNum(reason.details.available)} / {formatNum(reason.details.required)} points</p>
                              </div>
                            {/if}
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-sm text-base-content/50 text-center py-4">No rewards for this card</p>
            {/if}
          </div>
        {/each}
      </div>
    {:else if groupBy === 'reward'}
      <!-- Group by Reward View -->
      <div class="space-y-4">
        {#each byReward() as rewardData}
          <div class="bg-base-200 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-bold">{rewardData.rewardDetails.name}</h4>
                <p class="text-xs text-base-content/50 font-mono">{rewardData.rewardDetails.id}</p>
                {#if rewardData.rewardDetails.type}
                  <div class="badge badge-sm mt-1">{rewardData.rewardDetails.type}</div>
                {/if}
              </div>
            </div>

            <div class="space-y-2">
              {#each rewardData.cardEstimations as cardEst}
                <div class="flex items-center justify-between bg-base-300 rounded p-2">
                  <div>
                    <p class="text-sm font-mono">{cardEst.card.code || cardEst.card.id}</p>
                    {#if cardEst.cost}
                      <p class="text-xs text-base-content/50">{formatNum(cardEst.cost.points)} points</p>
                    {/if}
                  </div>
                  <div class="flex items-center gap-2">
                    {#if cardEst.status === 'AVAILABLE'}
                      <button
                        class="btn btn-xs btn-primary"
                        onclick={() => handlePurchaseClick(cardEst.card, rewardData.rewardDetails.id)}
                      >
                        Purchase
                      </button>
                      <div class="badge badge-success badge-sm">Available</div>
                    {:else}
                      <div class="badge badge-ghost badge-sm">Unavailable</div>
                    {/if}
                  </div>
                </div>
                {#if cardEst.unavailability_reasons && cardEst.unavailability_reasons.length > 0}
                  <div class="ml-4 space-y-1">
                    {#each cardEst.unavailability_reasons as reason}
                      {@const display = getUnavailabilityDisplay(reason)}
                      <div class="text-xs text-base-content/60">
                        ↳ {display.text}
                      </div>
                    {/each}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else if groupBy === 'availability'}
      <!-- Group by Availability View -->
      {@const availabilityData = byAvailability()}
      <div class="space-y-4">
        <!-- Available Rewards -->
        <div class="bg-base-200 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <div class="badge badge-success">Available</div>
            <span class="font-semibold">{availabilityData.available.length} rewards</span>
          </div>
          {#if availabilityData.available.length > 0}
            <div class="space-y-2">
              {#each availabilityData.available as item}
                <div class="bg-base-300 rounded p-3 flex items-center justify-between">
                  <div>
                    <p class="font-semibold">{item.rewardDetails.name}</p>
                    <p class="text-xs text-base-content/50">via {item.card.code || item.card.id}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      class="btn btn-xs btn-primary"
                      onclick={() => handlePurchaseClick(item.card, item.reward.id)}
                    >
                      Purchase
                    </button>
                    {#if item.cost}
                      <span class="font-bold text-primary">{formatNum(item.cost.points)} pts</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-base-content/50 text-center py-4">No available rewards</p>
          {/if}
        </div>

        <!-- Unavailable Rewards -->
        <div class="bg-base-200 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-3">
            <div class="badge badge-ghost">Unavailable</div>
            <span class="font-semibold">{availabilityData.unavailable.length} rewards</span>
          </div>
          {#if availabilityData.unavailable.length > 0}
            <div class="space-y-2">
              {#each availabilityData.unavailable as item}
                <div class="bg-base-300 rounded p-3">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <p class="font-semibold">{item.rewardDetails.name}</p>
                      <p class="text-xs text-base-content/50">via {item.card.code || item.card.id}</p>
                    </div>
                    {#if item.cost}
                      <span class="font-bold text-base-content/50">{formatNum(item.cost.points)} pts</span>
                    {/if}
                  </div>
                  {#if item.unavailability_reasons && item.unavailability_reasons.length > 0}
                    <div class="space-y-1">
                      {#each item.unavailability_reasons as reason}
                        {@const display = getUnavailabilityDisplay(reason)}
                        <div class="text-xs text-base-content/60">
                          ↳ {display.text}
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-base-content/50 text-center py-4">All rewards are available</p>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Raw JSON Response -->
    <div class="bg-base-200 rounded-xl p-4">
      <button
        class="flex items-center justify-between w-full"
        onclick={() => (showJson = !showJson)}
      >
        <h4 class="font-bold">Raw JSON Response</h4>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 transition-transform {showJson ? 'rotate-180' : ''}"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {#if showJson}
        <pre class="mt-3 text-xs bg-base-300 rounded p-3 overflow-x-auto max-h-96 overflow-y-auto">{JSON.stringify(results, null, 2)}</pre>
      {/if}
    </div>
  </div>
{:else}
  <div class="text-center py-12 text-base-content/60">
    <p>No results to display</p>
    <p class="text-sm text-base-content/40 mt-2">Run an examination to see available rewards</p>
  </div>
{/if}

<!-- Purchase Reward Modal -->
<PurchaseRewardModal
  open={purchaseModalOpen}
  card={selectedCard}
  {programId}
  {memberId}
  rewardId={selectedRewardId}
  onClose={() => { purchaseModalOpen = false; }}
  onSuccess={handlePurchaseSuccess}
/>
