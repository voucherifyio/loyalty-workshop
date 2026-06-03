<script>
  import { formatNum } from '../../utils/transactionFormatting.js';

  let { tiles = [] } = $props();
</script>

<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
  {#each tiles as tile (tile.label)}
    <div class="bg-base-200 rounded-lg p-3 text-center">
      <p class="text-base font-bold {tile.colorClass}">{formatNum(tile.value)}</p>
      <p class="text-[9px] text-base-content/50 mt-0.5 leading-tight">{tile.label}</p>
    </div>
  {/each}
</div>
