<script>
  import { formatNum } from '../../utils/transactionFormatting.js';

  let {
    rewardEst,
    rewardDetails,
    onPurchaseClick = () => {}
  } = $props();

  // Get display text for unavailability reason
  function getUnavailabilityDisplay(reason) {
    if (!reason) return 'Unknown reason';
    
    const displays = {
      INSUFFICIENT_POINTS: 'Insufficient points',
      OUT_OF_STOCK: 'Out of stock',
      NOT_IN_TIER: 'Not in required tier',
      OUTSIDE_VALIDITY_PERIOD: 'Outside validity period',
      MISSING_REQUIRED_METADATA: 'Missing required metadata',
      COST_NOT_APPLICABLE: 'Cost not applicable to this card'
    };
    
    return displays[reason] || reason.replace(/_/g, ' ').toLowerCase();
  }

  const statusColors = {
    AVAILABLE: 'badge-success',
    UNAVAILABLE: 'badge-error',
    PARTIALLY_AVAILABLE: 'badge-warning'
  };

  const statusColor = $derived(statusColors[rewardEst.status] || 'badge-neutral');
</script>

<div class="bg-base-300 rounded p-3">
  <div class="flex items-start justify-between mb-2">
    <div class="flex-1">
      <p class="font-semibold">{rewardDetails?.name || 'Unknown Reward'}</p>
      <p class="text-xs text-base-content/50 font-mono">{rewardEst.reward.id}</p>
    </div>
    <div class="flex items-center gap-2">
      {#if rewardEst.cost}
        <span class="font-bold text-primary">{formatNum(rewardEst.cost.points)} pts</span>
      {/if}
      {#if rewardEst.status === 'AVAILABLE'}
        <button
          class="btn btn-xs btn-primary"
          onclick={onPurchaseClick}
        >
          Purchase
        </button>
      {/if}
    </div>
  </div>
  
  <div class="flex items-center gap-2">
    <span class="badge badge-xs {statusColor}">{rewardEst.status}</span>
    {#if rewardEst.status !== 'AVAILABLE' && rewardEst.reason}
      <span class="text-xs text-base-content/50">
        {getUnavailabilityDisplay(rewardEst.reason)}
      </span>
    {/if}
  </div>
</div>
