<script>
  import { formatNum } from '../../utils/transactionFormatting.js';

  let {
    cards = [],
    selectedCardIndex = null,
    onSelectCard = () => {},
    onAdjustPoints = () => {},
  } = $props();

  let hoveredCards = $state(new Set());
</script>

<div>
  {#if cards.length === 0}
    <p class="text-sm text-base-content/50 text-center py-8 bg-base-200 rounded-lg">
      No cards assigned to this member
    </p>
  {:else}
    <div class="flex gap-4 overflow-x-auto p-2">
      {#each cards as mc, i}
        {@const card = mc.card}
        {@const isSelected = i === selectedCardIndex}
        {@const tp = mc.tier_progress?.current}
        {@const tpPct = tp ? Math.min(100, Math.round(((tp.points.current - tp.points.min) / Math.max(tp.points.max - tp.points.min, 1)) * 100)) : 0}
        <div
          role="button"
          tabindex="0"
          class="bg-base-100 shadow-sm rounded-lg p-4 transition-all relative min-w-80 shrink-0 cursor-pointer {isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}"
          onclick={() => onSelectCard(i)}
          onkeydown={(e) => e.key === 'Enter' && onSelectCard(i)}
          onmouseenter={() => {
            hoveredCards = new Set(hoveredCards).add(i);
          }}
          onmouseleave={() => {
            const newSet = new Set(hoveredCards);
            newSet.delete(i);
            hoveredCards = newSet;
          }}
        >
          <!-- Action Toolbar on Hover -->
          <div class="absolute top-2 right-2 z-10">
            <div class="join join-horizontal bg-base-100/90 rounded-lg transition-opacity {hoveredCards.has(i) ? 'opacity-100' : 'opacity-0'}">
              <button
                class="btn btn-xs btn-circle btn-ghost join-item tooltip tooltip-bottom"
                data-tip="Adjust Points"
                onclick={(e) => { e.stopPropagation(); onAdjustPoints(i); }}
                aria-label="Adjust Points"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Card Header -->
          <div class="mb-3">
            <p class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50 mb-0.5">
              {card?.card_type || mc.member_role || 'Card'}
            </p>
            <p class="text-sm font-mono truncate font-medium">{card?.code || card?.id || '–'}</p>
          </div>

          <!-- Balance Display -->
          <div class="mb-3">
            <p class="text-3xl font-bold text-primary">{formatNum(card?.balance?.points ?? 0)}</p>
            <p class="text-xs text-base-content/50">Available Points</p>
            {#if card?.balance?.pending_points > 0}
              <p class="text-xs text-warning mt-1">{formatNum(card.balance.pending_points)} pending</p>
            {/if}
          </div>

          <!-- Tier Progress (if exists) -->
          {#if tp}
            <div class="pt-3 border-t border-base-300">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[10px] font-semibold text-base-content/60">{tp.name}</span>
                <span class="text-[10px] text-base-content/40">{tpPct}%</span>
              </div>
              <div class="h-2 rounded-full bg-base-300 overflow-hidden">
                <div class="h-full rounded-full bg-primary transition-all" style="width: {Math.max(tpPct, 2)}%"></div>
              </div>
              <div class="flex justify-between mt-0.5">
                <span class="text-[9px] text-base-content/40">{formatNum(tp.points.current)}</span>
                <span class="text-[9px] text-base-content/40">{formatNum(tp.points.max)}</span>
              </div>
            </div>
          {/if}

          <!-- Next Expiration (if exists) -->
          {#if card?.next_expiration}
            <div class="mt-3 pt-3 border-t border-base-300">
              <p class="text-[9px] font-semibold text-base-content/40 uppercase tracking-wide mb-0.5">Next Expiration</p>
              <p class="text-xs text-warning font-medium">
                {new Date(card.next_expiration.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
              <p class="text-[10px] text-base-content/50">{formatNum(card.next_expiration.points)} pts</p>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
