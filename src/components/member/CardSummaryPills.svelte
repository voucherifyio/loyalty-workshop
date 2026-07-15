<script>
  import { formatNum } from "../../utils/transactionFormatting.js";
  import { calculateTierProgress } from "../../utils/tierProgress.js";
  import CountBadge from "../shared/CountBadge.svelte";

  let {
    cards = [],
    onCardSelect = () => {},
    onAdjustPoints = () => {},
    onPayWithPoints = () => {},
  } = $props();
</script>

{#if cards && cards.length > 0}
  <div class="bg-base-200/50 rounded-xl p-5">
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">
      Cards <CountBadge count={cards.length} className="ml-1 normal-case" />
    </p>
    <div class="flex gap-3 overflow-x-auto pb-2">
      {#each cards as mc, i (mc.card.id)}
        {@const card = mc.card}
        {@const tp = mc.tier_progress?.current}
        <div class="bg-base-100 rounded-lg p-3 min-w-48 shrink-0 shadow-sm flex flex-col">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50 mb-0.5">
                {card?.card_type || mc.member_role || 'Card'}
              </p>
              <p class="text-xs font-mono truncate font-medium">{card?.code || card?.id || '–'}</p>
            </div>
          </div>
          <div class="flex items-baseline gap-2">
            <p class="text-2xl font-bold text-primary">{formatNum(card?.balance?.points ?? 0)}</p>
            <p class="text-[10px] text-base-content/40">pts</p>
          </div>
          {#if tp?.id}
            {@const pct = calculateTierProgress(tp.points.current, tp.points.min, tp.points.max)}
            <div class="mt-2 pt-2 border-t border-base-300">
              <p class="text-[9px] text-base-content/50 mb-1">{tp.name}</p>
              <div class="h-1 rounded-full bg-base-300 overflow-hidden">
                <div class="h-full rounded-full bg-primary transition-all" style="width: {Math.max(pct, 2)}%"></div>
              </div>
            </div>
          {/if}
          
          <!-- Action Buttons -->
          <div class="mt-auto pt-3 border-t border-base-300 flex gap-2" class:mt-3={!tp?.id}>
            <button 
              class="btn btn-xs btn-outline flex-1"
              onclick={() => {
                onCardSelect(i);
                onAdjustPoints(i);
              }}
              title="Adjust card balance"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Adjust
            </button>
            <button 
              class="btn btn-xs btn-primary flex-1"
              onclick={() => {
                onCardSelect(i);
                onPayWithPoints(i);
              }}
              title="Pay for an order with points"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              Pay
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
