<script>
  import { LayerCake, Svg } from 'layercake';
  import { scaleBand } from 'd3-scale';
  import { formatNum, formatDate } from '../../utils/transactionFormatting.js';
  import * as reportsService from '../../services/reportsService.js';
  import StackedBars from '../charts/StackedBars.svelte';
  import MultiLine from '../charts/MultiLine.svelte';
  import AxisX from '../charts/AxisX.svelte';
  import AxisY from '../charts/AxisY.svelte';
  import HoverLayer from '../charts/HoverLayer.svelte';
  import {
    RANGE_OPTIONS,
    RESOLUTION_OPTIONS,
    POS_KEYS,
    NEG_KEYS,
    FLOW_COLORS,
    FLOW_LABELS,
    PENDING_SERIES,
  } from '../../utils/reportChartConfig.js';
  import {
    fmtISO,
    fillChartGaps,
    computeFlowSegments,
    computeFlowYDomain,
    computePendingYDomain,
    hasPendingData as checkHasPendingData,
    calculateKPIs,
    fmtDateTick as formatDateTick,
    fmtTooltipDate as formatTooltipDate,
    fmtYTick,
    computeXTickMod,
  } from '../../utils/reportDataTransforms.js';

  let { programId, memberId, cardId } = $props();

  // ─── Controls ─────────────────────────────────────────────────────────────
  let rangeDays = $state(30);
  let resolution = $state('day');

  // ─── Tooltip state ────────────────────────────────────────────────────────
  let flowTip  = $state({ visible: false, clientX: 0, clientY: 0, bucket: null });
  let pendTip  = $state({ visible: false, clientX: 0, clientY: 0, bucket: null });

  // ─── Data ─────────────────────────────────────────────────────────────────
  let reportData = $state([]);
  let loading = $state(false);
  let fetchError = $state(null);

  $effect(() => {
    if (!programId || !memberId || !cardId) return;
    // Capture all reactive values before the async boundary
    const s = startDateStr;
    const e = endDateStr;
    const res = resolution;
    fetchReports(s, e, res);
  });

  async function fetchReports(start_date, end_date, res) {
    loading = true;
    fetchError = null;
    try {
      reportData = await reportsService.fetchCardReports(
        programId,
        memberId,
        cardId,
        { start_date, end_date, resolution: res }
      );
    } catch (err) {
      fetchError = err.message || 'Failed to load report data';
      reportData = [];
    } finally {
      loading = false;
    }
  }

  // ─── Derived: Date boundaries ─────────────────────────────────────────────
  const endDateStr   = $derived(fmtISO(new Date()));
  const startDateStr = $derived(fmtISO(new Date(Date.now() - rangeDays * 86_400_000)));

  // ─── Derived: Chart data with gap filling ─────────────────────────────────
  const chartData = $derived(fillChartGaps(reportData, startDateStr, endDateStr, resolution));

  // ─── Derived: Flow chart data ─────────────────────────────────────────────
  const flowXDomain = $derived(chartData.map(d => d.date));
  const flowSegments = $derived(computeFlowSegments(chartData));
  const flowYDomain = $derived(computeFlowYDomain(chartData));

  // ─── Derived: Pending chart data ──────────────────────────────────────────
  const pendingYDomain = $derived(computePendingYDomain(chartData));
  const hasPendingData = $derived(checkHasPendingData(chartData));

  // ─── Derived: KPI tiles ────────────────────────────────────────────────────
  const kpis = $derived(calculateKPIs(chartData));

  // ─── Derived: Tick formatting ─────────────────────────────────────────────
  const xTickMod = $derived(computeXTickMod(flowXDomain.length));
  const filteredXTicks = $derived(
    flowXDomain.filter((_, i) => i % xTickMod === 0 || i === flowXDomain.length - 1)
  );

</script>

<div class="space-y-4">
  <div class="flex items-center justify-between flex-wrap gap-2">
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Point Reports</p>

    <div class="flex items-center gap-2 flex-wrap">
      <!-- Range presets -->
      <div class="join">
        {#each RANGE_OPTIONS as opt}
          <button
            class="join-item btn btn-xs {rangeDays === opt.days ? 'btn-primary' : 'btn-ghost'}"
            onclick={() => { rangeDays = opt.days; }}
          >
            {opt.label}
          </button>
        {/each}
      </div>

      <!-- Resolution selector -->
      <select
        class="select select-xs select-bordered"
        bind:value={resolution}
      >
        {#each RESOLUTION_OPTIONS as opt}
          <option value={opt.value}>{opt.label}</option>
        {/each}
      </select>
    </div>
  </div>

  {#if loading}
    <div class="flex items-center gap-2 text-base-content/40 text-sm py-6 justify-center">
      <span class="loading loading-spinner loading-sm"></span>Loading report…
    </div>
  {:else if fetchError}
    <div class="alert alert-error text-xs">{fetchError}</div>
  {:else if !chartData.length}
    <p class="text-sm text-base-content/40 py-4 text-center">No report data for the selected period.</p>
  {:else}

    <!-- ── KPI tiles ──────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {@render kpiTile('Net Change', kpis.net, kpis.net >= 0 ? 'text-success' : 'text-error')}
      {@render kpiTile('Earned',     kpis.earned,     'text-success')}
      {@render kpiTile('Spent',      kpis.spent,      'text-error')}
      {@render kpiTile('Expired',    kpis.expired,    'text-base-content/50')}
      {#if kpis.added > 0}
        {@render kpiTile('Added',    kpis.added,      'text-info')}
      {/if}
      {#if kpis.subtracted > 0}
        {@render kpiTile('Subtracted', kpis.subtracted, 'text-warning')}
      {/if}
      {#if kpis.refunded > 0}
        {@render kpiTile('Refunded', kpis.refunded,   'text-success')}
      {/if}
      {#if kpis.locked > 0 || kpis.unlocked > 0}
        {@render kpiTile('Locked',   kpis.locked,     'text-warning')}
        {@render kpiTile('Unlocked', kpis.unlocked,   'text-primary')}
      {/if}
      {#if kpis.pActivated > 0}
        {@render kpiTile('Pend. Activated', kpis.pActivated, 'text-success')}
      {/if}
      {#if kpis.pCanceled > 0}
        {@render kpiTile('Pend. Canceled',  kpis.pCanceled,  'text-error')}
      {/if}
    </div>

    <!-- ── Flow breakdown chart ───────────────────────────────────────────── -->
    <div>
      <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest mb-2">Point Flow Breakdown</p>
      <div class="bg-base-200 rounded-xl p-3">
        <!-- Legend -->
        <div class="flex flex-wrap gap-x-3 gap-y-1 mb-3">
          {#each [...POS_KEYS, ...NEG_KEYS] as k}
            {#if chartData.some(d => (d[k] || 0) > 0)}
              <span class="flex items-center gap-1 text-[9px] text-base-content/60">
                <span class="inline-block w-2 h-2 rounded-sm" style="background:{FLOW_COLORS[k]}"></span>
                {FLOW_LABELS[k]}
              </span>
            {/if}
          {/each}
        </div>

        <div style="height: 180px; position: relative;">
          <LayerCake
            data={chartData}
            x="date"
            y={[...POS_KEYS, ...NEG_KEYS]}
            xScale={scaleBand().padding(0.25)}
            xDomain={flowXDomain}
            yDomain={flowYDomain}
            padding={{ top: 4, right: 8, bottom: 24, left: 40 }}
          >
              <Svg>
              {#snippet children()}
                <AxisY formatTick={fmtYTick} />
                <AxisX ticks={filteredXTicks} formatTick={(d) => formatDateTick(d, resolution)} />
                <StackedBars segments={flowSegments} colors={FLOW_COLORS} xKey="date" />
                <HoverLayer
                  onhover={({ bucket, clientX, clientY }) => {
                    flowTip = { visible: true, clientX, clientY, bucket };
                  }}
                  onleave={() => { flowTip = { ...flowTip, visible: false }; }}
                />
              {/snippet}
            </Svg>
          </LayerCake>
        </div>
      </div>
    </div>

    <!-- ── Pending points chart ───────────────────────────────────────────── -->
    {#if hasPendingData}
      <div>
        <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest mb-2">Pending Points Trend</p>
        <div class="bg-base-200 rounded-xl p-3">
          <!-- Legend -->
          <div class="flex flex-wrap gap-x-3 gap-y-1 mb-3">
            {#each PENDING_SERIES as s}
              <span class="flex items-center gap-1 text-[9px] text-base-content/60">
                <span class="inline-block w-2 h-2 rounded-full" style="background:{s.color}"></span>
                {s.label}
              </span>
            {/each}
          </div>

          <div style="height: 140px; position: relative;">
            <LayerCake
              data={chartData}
              x="date"
              xScale={scaleBand().padding(0.25)}
              xDomain={flowXDomain}
              yDomain={pendingYDomain}
              padding={{ top: 4, right: 8, bottom: 24, left: 40 }}
            >
                <Svg>
                {#snippet children()}
                  <AxisY formatTick={fmtYTick} />
                  <AxisX ticks={filteredXTicks} formatTick={(d) => formatDateTick(d, resolution)} />
                  <MultiLine
                    series={PENDING_SERIES}
                    xKey="date"
                    dotRadius={flowXDomain.length > 30 ? 2 : 3}
                  />
                  <HoverLayer
                    onhover={({ bucket, clientX, clientY }) => {
                      pendTip = { visible: true, clientX, clientY, bucket };
                    }}
                    onleave={() => { pendTip = { ...pendTip, visible: false }; }}
                  />
                {/snippet}
              </Svg>
            </LayerCake>
          </div>
        </div>
      </div>
    {/if}

  {/if}
</div>

<!-- ── Tooltips (fixed-position, outside normal flow) ─────────────────────── -->
{#if flowTip.visible && flowTip.bucket}
  {@const b = flowTip.bucket}
  {@const tipLeft = flowTip.clientX + 14}
  {@const tipTop  = flowTip.clientY - 12}
  <div
    class="pointer-events-none fixed z-9999 rounded-xl bg-base-100 border border-base-300 shadow-xl px-3 py-2.5 text-xs min-w-[160px]"
    style="left: {tipLeft}px; top: {tipTop}px;"
  >
    <p class="font-bold text-base-content mb-1.5">{formatTooltipDate(b.date, resolution, formatDate)}</p>
    {#each [...POS_KEYS, ...NEG_KEYS] as k}
      {#if (b[k] || 0) > 0}
        <div class="flex items-center gap-1.5 mt-0.5">
          <span class="inline-block w-2 h-2 rounded-sm shrink-0" style="background: {FLOW_COLORS[k]}"></span>
          <span class="text-base-content/60 shrink-0">{FLOW_LABELS[k]}</span>
          <span class="font-semibold tabular-nums ml-auto pl-2">{formatNum(b[k])}</span>
        </div>
      {/if}
    {/each}
  </div>
{/if}

{#if pendTip.visible && pendTip.bucket}
  {@const b = pendTip.bucket}
  {@const tipLeft = pendTip.clientX + 14}
  {@const tipTop  = pendTip.clientY - 12}
  <div
    class="pointer-events-none fixed z-9999 rounded-xl bg-base-100 border border-base-300 shadow-xl px-3 py-2.5 text-xs min-w-[160px]"
    style="left: {tipLeft}px; top: {tipTop}px;"
  >
    <p class="font-bold text-base-content mb-1.5">{formatTooltipDate(b.date, resolution, formatDate)}</p>
    {#each PENDING_SERIES as s}
      {#if (b[s.key] || 0) > 0}
        <div class="flex items-center gap-1.5 mt-0.5">
          <span class="inline-block w-2 h-2 rounded-full shrink-0" style="background: {s.color}"></span>
          <span class="text-base-content/60 shrink-0">{s.label}</span>
          <span class="font-semibold tabular-nums ml-auto pl-2">{formatNum(b[s.key])}</span>
        </div>
      {/if}
    {/each}
  </div>
{/if}

{#snippet kpiTile(label, value, colorClass)}
  <div class="bg-base-200 rounded-lg p-3 text-center">
    <p class="text-base font-bold {colorClass}">{formatNum(value)}</p>
    <p class="text-[9px] text-base-content/50 mt-0.5 leading-tight">{label}</p>
  </div>
{/snippet}
