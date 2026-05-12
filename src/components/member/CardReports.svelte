<script>
  import { LayerCake, Svg } from 'layercake';
  import { scaleBand } from 'd3-scale';
  import { api } from '../../api/client.js';
  import { endpoints } from '../../api/endpoints.js';
  import { formatNum, formatDate } from '../../utils/transactionFormatting.js';
  import StackedBars from '../charts/StackedBars.svelte';
  import MultiLine from '../charts/MultiLine.svelte';
  import AxisX from '../charts/AxisX.svelte';
  import AxisY from '../charts/AxisY.svelte';
  import HoverLayer from '../charts/HoverLayer.svelte';

  let { programId, memberId, cardId } = $props();

  // ─── Controls ─────────────────────────────────────────────────────────────
  let rangeDays = $state(30);
  let resolution = $state('day');

  const RANGE_OPTIONS = [
    { label: '7D',  days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: '12M', days: 365 },
  ];
  const RESOLUTION_OPTIONS = [
    { value: 'day',     label: 'Daily' },
    { value: 'week',    label: 'Weekly' },
    { value: 'month',   label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
  ];

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
      const result = await api.get(
        endpoints.members.dailyReports(programId, memberId, cardId, {
          start_date,
          end_date,
          resolution: res,
        })
      );
      reportData = result.data ?? [];
    } catch (err) {
      fetchError = err.message || 'Failed to load report data';
      reportData = [];
    } finally {
      loading = false;
    }
  }

  // ─── Flow chart constants ──────────────────────────────────────────────────
  const POS_KEYS = [
    'points_earned',
    'points_added',
    'points_refunded',
    'points_returned',
    'points_unlocked',
  ];
  const NEG_KEYS = [
    'points_spent',
    'points_subtracted',
    'points_expired',
    'points_locked',
  ];

  const FLOW_COLORS = {
    points_earned:     'var(--color-success)',
    points_added:      'var(--color-info)',
    points_refunded:   'color-mix(in oklch, var(--color-success) 60%, white)',
    points_returned:   'color-mix(in oklch, var(--color-info) 60%, white)',
    points_unlocked:   'var(--color-primary)',
    points_spent:      'var(--color-error)',
    points_subtracted: 'var(--color-warning)',
    points_expired:    'color-mix(in oklch, var(--color-base-content) 35%, transparent)',
    points_locked:     'color-mix(in oklch, var(--color-warning) 60%, black)',
  };

  const FLOW_LABELS = {
    points_earned:     'Earned',
    points_added:      'Added',
    points_refunded:   'Refunded',
    points_returned:   'Returned',
    points_unlocked:   'Unlocked',
    points_spent:      'Spent',
    points_subtracted: 'Subtracted',
    points_expired:    'Expired',
    points_locked:     'Locked',
  };

  // ─── Normalise raw API date field ─────────────────────────────────────────
  // The `date` field may arrive as:
  //   • "YYYY-MM-DD"               — plain ISO date string
  //   • "YYYY-MM-DDTHH:MM:SS.sssZ" — full ISO datetime (extract date part)
  //   • { date: "YYYY-MM-DD…" }    — wrapped object (same pattern as formatDate())
  // Always returns a plain "YYYY-MM-DD" string.
  function rawDate(field) {
    if (!field) return '';
    const raw = (typeof field === 'object' && typeof field.date === 'string')
      ? field.date
      : String(field);
    // Take only the date portion — handles both "YYYY-MM-DD" and full datetimes.
    return raw.slice(0, 10);
  }

  // ─── Date range helpers ────────────────────────────────────────────────────
  // Format a local Date as "YYYY-MM-DD".
  function fmtISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // Parse "YYYY-MM-DD" as a local Date (avoids UTC midnight → day-shift issues).
  function parseLocal(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /**
   * Generate every expected bucket date for [startStr, endStr] at the given
   * resolution. Matches the API's bucketing convention:
   *  - day     → every calendar day
   *  - week    → every 7 days starting from startStr
   *  - month   → 1st of each calendar month
   *  - quarter → 1st of each calendar quarter (Jan/Apr/Jul/Oct)
   */
  function generateDateRange(startStr, endStr, res) {
    const start = parseLocal(startStr);
    const end   = parseLocal(endStr);
    const dates = [];

    if (res === 'day') {
      for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
        dates.push(fmtISO(new Date(cur)));
      }
    } else if (res === 'week') {
      // Snap to the Monday of the week containing start (ISO week, Monday = day 1).
      // getDay() returns 0=Sun … 6=Sat; shift so Monday lands at offset 0.
      const day = start.getDay();                        // 0–6
      const toMonday = day === 0 ? -6 : 1 - day;        // e.g. Wed(3) → -2, Sun(0) → -6
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() + toMonday);
      for (let cur = weekStart; cur <= end; cur.setDate(cur.getDate() + 7)) {
        dates.push(fmtISO(new Date(cur)));
      }
    } else if (res === 'month') {
      let cur = new Date(start.getFullYear(), start.getMonth(), 1);
      const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      while (cur <= endMonth) {
        dates.push(fmtISO(cur));
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      }
    } else if (res === 'quarter') {
      const qMonth = Math.floor(start.getMonth() / 3) * 3;
      let cur = new Date(start.getFullYear(), qMonth, 1);
      const endQMonth = Math.floor(end.getMonth() / 3) * 3;
      const endQ = new Date(end.getFullYear(), endQMonth, 1);
      while (cur <= endQ) {
        dates.push(fmtISO(cur));
        cur = new Date(cur.getFullYear(), cur.getMonth() + 3, 1);
      }
    }

    return dates;
  }

  // Zero-valued record used for buckets the API did not return.
  const ZERO_RECORD = {
    points_total: 0, points_earned: 0, points_added: 0, points_subtracted: 0,
    points_expired: 0, points_spent: 0, points_refunded: 0, points_returned: 0,
    points_locked: 0, points_unlocked: 0,
    pending_points_total: 0, pending_points_activated: 0, pending_points_canceled: 0,
    object: 'card_daily_report',
  };

  // Reactive date boundaries derived from controls (avoids repeating the calc).
  const endDateStr   = $derived(fmtISO(new Date()));
  const startDateStr = $derived(fmtISO(new Date(Date.now() - rangeDays * 86_400_000)));

  // Normalised + gap-filled chart data:
  //  1. normalise d.date to a plain ISO string
  //  2. generate every expected bucket for the range
  //  3. insert ZERO_RECORD for any bucket missing from the API response
  const chartData = $derived.by(() => {
    const byDate = new Map(
      reportData.map(d => [rawDate(d.date), { ...d, date: rawDate(d.date) }])
    );
    const allDates = generateDateRange(startDateStr, endDateStr, resolution);
    return allDates.map(date => byDate.get(date) ?? { ...ZERO_RECORD, date });
  });

  // ─── Derived: flow chart data ──────────────────────────────────────────────
  const flowXDomain = $derived(chartData.map(d => d.date));

  const flowSegments = $derived.by(() => {
    const segs = [];
    for (const d of chartData) {
      let posBase = 0;
      for (const k of POS_KEYS) {
        const v = d[k] || 0;
        if (v > 0) {
          segs.push({ key: k, date: d.date, y0: posBase, y1: posBase + v });
          posBase += v;
        }
      }
      let negBase = 0;
      for (const k of NEG_KEYS) {
        const v = d[k] || 0;
        if (v > 0) {
          segs.push({ key: k, date: d.date, y0: negBase, y1: negBase - v });
          negBase -= v;
        }
      }
    }
    return segs;
  });

  const flowYDomain = $derived.by(() => {
    if (!chartData.length) return [-1, 1];
    let maxPos = 0;
    let minNeg = 0;
    for (const d of chartData) {
      const posSum = POS_KEYS.reduce((s, k) => s + (d[k] || 0), 0);
      const negSum = NEG_KEYS.reduce((s, k) => s + (d[k] || 0), 0);
      if (posSum > maxPos) maxPos = posSum;
      if (-negSum < minNeg) minNeg = -negSum;
    }
    return [minNeg === 0 ? -1 : minNeg * 1.1, maxPos === 0 ? 1 : maxPos * 1.1];
  });

  // ─── Derived: pending chart data ───────────────────────────────────────────
  const PENDING_SERIES = [
    { key: 'pending_points_total',     label: 'Total',     color: 'var(--color-warning)' },
    { key: 'pending_points_activated', label: 'Activated', color: 'var(--color-success)' },
    { key: 'pending_points_canceled',  label: 'Canceled',  color: 'var(--color-error)' },
  ];

  const pendingYDomain = $derived.by(() => {
    if (!chartData.length) return [0, 1];
    let max = 0;
    for (const d of chartData) {
      for (const s of PENDING_SERIES) {
        const v = d[s.key] || 0;
        if (v > max) max = v;
      }
    }
    return [0, max === 0 ? 1 : max * 1.1];
  });

  const hasPendingData = $derived(
    chartData.some(d => PENDING_SERIES.some(s => (d[s.key] || 0) > 0))
  );

  // ─── Derived: KPI tiles ────────────────────────────────────────────────────
  const kpis = $derived.by(() => {
    const sum = (k) => chartData.reduce((s, d) => s + (d[k] || 0), 0);
    const earned      = sum('points_earned');
    const added       = sum('points_added');
    const spent       = sum('points_spent');
    const subtracted  = sum('points_subtracted');
    const expired     = sum('points_expired');
    const refunded    = sum('points_refunded');
    const returned    = sum('points_returned');
    const locked      = sum('points_locked');
    const unlocked    = sum('points_unlocked');
    const pActivated  = sum('pending_points_activated');
    const pCanceled   = sum('pending_points_canceled');
    const net = earned + added + refunded + returned + unlocked
              - spent - subtracted - expired - locked;
    return { earned, added, spent, subtracted, expired, refunded, returned,
             locked, unlocked, pActivated, pCanceled, net };
  });

  // ─── Tick + tooltip date formatters ──────────────────────────────────────
  // Returns the quarter number (1-4) for a "YYYY-MM-DD" string.
  function quarterOf(dateStr) {
    const m = Number(dateStr.slice(5, 7));
    return Math.floor((m - 1) / 3) + 1;
  }

  // Short label for x-axis ticks — must be compact.
  function fmtDateTick(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (resolution === 'quarter') return `Q${quarterOf(dateStr)} ${y}`;
    if (resolution === 'month')   return dt.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
    // day or week
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // Rich label for tooltip headings — can be longer.
  function fmtTooltipDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    if (resolution === 'quarter') {
      const q = quarterOf(dateStr);
      const qStartMonth = (q - 1) * 3;        // 0-indexed month of quarter start
      const qEndMonth   = qStartMonth + 2;     // 0-indexed month of quarter end
      const startName = new Date(y, qStartMonth, 1).toLocaleDateString(undefined, { month: 'short' });
      const endName   = new Date(y, qEndMonth,   1).toLocaleDateString(undefined, { month: 'short' });
      return `Q${q} ${y} (${startName}–${endName})`;
    }
    if (resolution === 'month') return dt.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    if (resolution === 'week') {
      const sunday = new Date(y, m - 1, d + 6);
      return `${formatDate(dateStr)} – ${formatDate(fmtISO(sunday))}`;
    }
    return formatDate(dateStr);
  }

  function fmtYTick(n) {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (abs >= 1_000)     return (n / 1_000).toFixed(0) + 'k';
    return String(Math.round(n));
  }

  // Determine how many x ticks to show based on data density
  const xTickMod = $derived.by(() => {
    const n = flowXDomain.length;
    if (n <= 12) return 1;
    if (n <= 30) return 3;
    if (n <= 90) return 7;
    return 30;
  });

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
                <AxisX ticks={filteredXTicks} formatTick={fmtDateTick} />
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
                  <AxisX ticks={filteredXTicks} formatTick={fmtDateTick} />
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
    <p class="font-bold text-base-content mb-1.5">{fmtTooltipDate(b.date)}</p>
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
    <p class="font-bold text-base-content mb-1.5">{fmtTooltipDate(b.date)}</p>
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
