<script>
  let {
    onPurchaseReward,
    onPayWithPoints,
    onCreateOrder,
    onTriggerEvent,
    onExamineEarnings,
  } = $props();
</script>

<div class="flex items-center gap-2 px-4 py-2 border-b border-base-300 shrink-0 bg-base-200/30 flex-wrap">
  <button class="btn btn-xs btn-outline" onclick={onPurchaseReward}>Purchase Reward</button>
  <button class="btn btn-xs btn-outline" onclick={onPayWithPoints}>Pay With Points</button>
  <div class="w-px h-4 bg-base-300 shrink-0"></div>
  <button class="btn btn-xs btn-outline" onclick={onCreateOrder}>Create Order</button>
  <button class="btn btn-xs btn-outline" onclick={onTriggerEvent}>Trigger Event</button>
  <button class="btn btn-xs btn-outline btn-info" onclick={onExamineEarnings}>Examine Earnings</button>
</div>
