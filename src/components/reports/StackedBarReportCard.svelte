<script>
  import { LayerCake, Svg } from 'layercake';
  import { scaleBand } from 'd3-scale';
  import { formatNum, formatDate } from '../../utils/transactionFormatting.js';
  import StackedBars from '../charts/StackedBars.svelte';
  import AxisX from '../charts/AxisX.svelte';
  import AxisY from '../charts/AxisY.svelte';
  import HoverLayer from '../charts/HoverLayer.svelte';
  import {
    computeStackSegments,
    computeStackYDomain,
    fmtDateTick as formatDateTick,
    fmtTooltipDate as formatTooltipDate,
    fmtYTick,
    computeXTickMod,
  } from '../../utils/reportDataTransforms.js';

  let {
    title = '',
    chartData = [],
    series = [],
    resolution = 'day',
  } = $props();

  let tooltip = $state({ visible: false, clientX: 0, clientY: 0, bucket: null });

  const xDomain = $derived(chartData.map(d => d.date));
  const seriesKeys = $derived(series.map(s => s.key));
  const segments = $derived(computeStackSegments(chartData, seriesKeys));
  const yDomain = $derived(computeStackYDomain(chartData, seriesKeys));
  const colors = $derived(
    Object.fromEntries(series.map(s => [s.key, s.color]))
  );

  const xTickMod = $derived(computeXTickMod(xDomain.length));
  const filteredXTicks = $derived(
    xDomain.filter((_, i) => i % xTickMod === 0 || i === xDomain.length - 1)
  );
</script>

<div>
  <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest mb-2">
    {title}
  </p>
  <div class="bg-base-200 rounded-xl p-3">
    <!-- Legend -->
    <div class="flex flex-wrap gap-x-3 gap-y-1 mb-3">
      {#each series as s (s.key)}
        {#if chartData.some(d => (d[s.key] || 0) > 0)}
          <span class="flex items-center gap-1 text-[9px] text-base-content/60">
            <span class="inline-block w-2 h-2 rounded-sm" style="background:{s.color}"></span>
            {s.label}
          </span>
        {/if}
      {/each}
    </div>

    <div style="height: 180px; position: relative;">
      <LayerCake
        data={chartData}
        x="date"
        y={seriesKeys}
        xScale={scaleBand().padding(0.25)}
        xDomain={xDomain}
        yDomain={yDomain}
        padding={{ top: 4, right: 8, bottom: 24, left: 40 }}
      >
        <Svg>
          <AxisY formatTick={fmtYTick} />
          <AxisX ticks={filteredXTicks} formatTick={(d) => formatDateTick(d, resolution)} />
          <StackedBars segments={segments} colors={colors} xKey="date" />
          <HoverLayer
            onhover={({ bucket, clientX, clientY }) => {
              tooltip = { visible: true, clientX, clientY, bucket };
            }}
            onleave={() => { tooltip = { ...tooltip, visible: false }; }}
          />
        </Svg>
      </LayerCake>
    </div>
  </div>
</div>

<!-- Tooltip -->
{#if tooltip.visible && tooltip.bucket}
  {@const b = tooltip.bucket}
  {@const tipLeft = tooltip.clientX + 14}
  {@const tipTop = tooltip.clientY - 12}
  <div
    class="pointer-events-none fixed z-9999 rounded-xl bg-base-100 border border-base-300 shadow-xl px-3 py-2.5 text-xs min-w-[160px]"
    style="left: {tipLeft}px; top: {tipTop}px;"
  >
    <p class="font-bold text-base-content mb-1.5">{formatTooltipDate(b.date, resolution, formatDate)}</p>
    {#each series as s (s.key)}
      {#if (b[s.key] || 0) > 0}
        <div class="flex items-center gap-1.5 mt-0.5">
          <span class="inline-block w-2 h-2 rounded-sm shrink-0" style="background: {s.color}"></span>
          <span class="text-base-content/60 shrink-0">{s.label}</span>
          <span class="font-semibold tabular-nums ml-auto pl-2">{formatNum(b[s.key])}</span>
        </div>
      {/if}
    {/each}
  </div>
{/if}
