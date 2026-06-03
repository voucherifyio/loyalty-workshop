<script>
  import { formatNum } from "../../utils/transactionFormatting.js";

  let { lifetimeBucket } = $props();
</script>

{#if lifetimeBucket}
  <div>
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">
      Lifetime Breakdown
    </p>
    <div class="bg-base-200/50 rounded-xl p-4">
      <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
        {#if lifetimeBucket.points}
          <div class="flex justify-between">
            <span class="text-base-content/60">Total earned</span>
            <span class="font-semibold">{formatNum(lifetimeBucket.points.earned)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Spent</span>
            <span class="font-semibold">{formatNum(lifetimeBucket.points.spent)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Expired</span>
            <span class="font-semibold text-error/80">{formatNum(lifetimeBucket.points.expired)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Added (manual)</span>
            <span class="font-semibold">{formatNum(lifetimeBucket.points.added)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Subtracted</span>
            <span class="font-semibold">{formatNum(lifetimeBucket.points.subtracted)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Refunded</span>
            <span class="font-semibold">{formatNum(lifetimeBucket.points.refunded)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Returned</span>
            <span class="font-semibold">{formatNum(lifetimeBucket.points.returned)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Locked</span>
            <span class="font-semibold text-warning/80">{formatNum(lifetimeBucket.points.locked)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Unlocked</span>
            <span class="font-semibold">{formatNum(lifetimeBucket.points.unlocked)}</span>
          </div>
        {/if}
        {#if lifetimeBucket.pending_points}
          <div class="col-span-2 border-t border-base-300 my-1"></div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Pending total</span>
            <span class="font-semibold text-warning">{formatNum(lifetimeBucket.pending_points.total)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Pending activated</span>
            <span class="font-semibold">{formatNum(lifetimeBucket.pending_points.activated)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Pending canceled</span>
            <span class="font-semibold text-error/80">{formatNum(lifetimeBucket.pending_points.canceled)}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
