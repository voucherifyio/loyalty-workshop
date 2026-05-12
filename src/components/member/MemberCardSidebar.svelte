<script>
  import { formatNum } from '../../utils/transactionFormatting.js';

  let {
    cards = [],
    selectedCardIndex = null,
    onSelectCard,
  } = $props();
</script>

<div class="w-52 shrink-0 border-r border-base-300 overflow-y-auto bg-base-200/30">

  <!-- Member entry -->
  <div class="p-2 pb-1">
    <button
      class="w-full text-left rounded-lg px-3 py-2.5 transition-colors cursor-pointer {selectedCardIndex === null ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}"
      onclick={() => onSelectCard(null)}
    >
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 opacity-70 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-0.5">Member</p>
          <p class="text-xs font-medium">Overview</p>
        </div>
      </div>
    </button>
  </div>

  <!-- Cards section -->
  <div class="px-3 pt-2 pb-1">
    <p class="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">Cards ({cards.length})</p>
  </div>

  {#if cards.length === 0}
    <p class="text-xs text-base-content/40 text-center py-4 px-3">No cards</p>
  {:else}
    <div class="space-y-1 p-2">
      {#each cards as mc, i}
        {@const card = mc.card}
        {@const isSelected = i === selectedCardIndex}
        {@const tp = mc.tier_progress?.current}
        {@const tpPct = tp ? Math.min(100, Math.round(((tp.points.current - tp.points.min) / Math.max(tp.points.max - tp.points.min, 1)) * 100)) : 0}
        <button
          class="w-full text-left rounded-lg px-3 py-2.5 transition-colors cursor-pointer {isSelected ? 'bg-primary text-primary-content' : 'hover:bg-base-300'}"
          onclick={() => onSelectCard(i)}
        >
          <p class="text-[10px] font-semibold uppercase tracking-wide opacity-70 mb-0.5">{card?.card_type || mc.member_role || 'Card'}</p>
          <p class="text-xs font-mono truncate font-medium">{card?.code || card?.id || '–'}</p>
          <p class="text-[11px] mt-1 font-bold">{formatNum(card?.balance?.points)} pts</p>
          {#if card?.balance?.pending_points > 0}
            <p class="text-[10px] opacity-60">{formatNum(card.balance.pending_points)} pending</p>
          {/if}
          {#if tp}
            <div class="mt-2">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-[9px] font-semibold opacity-70">{tp.name}</span>
                <span class="text-[9px] opacity-50">{tp.points.current}/{tp.points.max}</span>
              </div>
              <div class="h-1.5 rounded-full bg-black/20 overflow-hidden">
                <div class="h-full rounded-full bg-white/70 transition-all" style="width: {tpPct}%"></div>
              </div>
            </div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>
