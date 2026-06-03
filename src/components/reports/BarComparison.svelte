<script>
  import { formatNum } from '../../utils/transactionFormatting.js';

  let { rows = [], series = [] } = $props();

  function computeTotal(row) {
    return series.reduce((sum, s) => sum + (row[s.key] || 0), 0);
  }

  function computePercent(value, total) {
    if (total === 0) return 0;
    return (value / total) * 100;
  }
</script>

<div class="space-y-3">
  {#each rows as row (row.id)}
    {@const total = computeTotal(row)}
    <div>
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-medium text-base-content/70">{row.label}</span>
        <span class="text-xs font-bold tabular-nums">{formatNum(total)}</span>
      </div>
      <div class="flex h-6 rounded-lg overflow-hidden bg-base-300">
        {#each series as s, i (s.key)}
          {@const value = row[s.key] || 0}
          {@const percent = computePercent(value, total)}
          {#if percent > 0}
            <div
              class="flex items-center justify-center text-[10px] font-semibold text-white"
              style="background: {s.color}; width: {percent}%;"
              title="{s.label}: {formatNum(value)}"
            >
              {#if percent > 15}
                {formatNum(value)}
              {/if}
            </div>
          {/if}
        {/each}
      </div>
      <div class="flex gap-3 mt-1">
        {#each series as s (s.key)}
          {@const value = row[s.key] || 0}
          {#if value > 0}
            <span class="flex items-center gap-1 text-[9px] text-base-content/60">
              <span class="inline-block w-2 h-2 rounded-sm" style="background:{s.color}"></span>
              {s.label}: {formatNum(value)}
            </span>
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</div>
