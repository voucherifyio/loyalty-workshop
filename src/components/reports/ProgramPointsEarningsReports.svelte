<script>
  import * as reportsService from '../../services/reportsService.js';
  import ReportControls from './ReportControls.svelte';
  import KpiTiles from './KpiTiles.svelte';
  import StackedBarReportCard from './StackedBarReportCard.svelte';
  import BarComparison from './BarComparison.svelte';
  import {
    POINTS_SERIES,
    EVENTS_SERIES,
    ZERO_RECORD,
  } from '../../utils/pointsEarningsReportConfig.js';
  import {
    fmtISO,
    fillChartGapsWith,
  } from '../../utils/reportDataTransforms.js';

  let { programId } = $props();

  // Controls
  let rangeDays = $state(7);
  let resolution = $state('day');
  let selectedEarningRule = $state('all'); // 'all' or specific earning_rule_id
  let selectedCardDefinition = $state('all'); // 'all' or specific card_definition_id
  let showPerRuleBreakdown = $state(false);

  // Data
  let dailyData = $state([]);
  let allSummaryData = $state([]); // All summary data (unfiltered, used for breakdown comparison and client-side filtering)
  let allEarningRules = $state([]); // Keep all earning rule ids for filter dropdown
  let allCardDefinitions = $state([]); // Keep all card defs for filter dropdown
  let hasLoadedDimensions = $state(false); // Track if we've attempted to load filter dimensions
  let lastProgramId = $state(null); // Track program ID changes
  let loading = $state(false);
  let fetchError = $state(null);

  // Derived date boundaries
  const endDateStr = $derived(fmtISO(new Date()));
  const startDateStr = $derived(fmtISO(new Date(Date.now() - rangeDays * 86_400_000)));

  // Derived chart data with gap filling
  const chartData = $derived(
    fillChartGapsWith(dailyData, startDateStr, endDateStr, resolution, ZERO_RECORD)
  );

  // Derived lists of unique dimension values (from all rows, not filtered)
  const earningRules = $derived(allEarningRules);
  const cardDefinitions = $derived(allCardDefinitions);

  // Client-side filtered summary data based on selected filters
  // This allows instant switching between filters without additional API calls
  const summaryData = $derived.by(() => {
    return allSummaryData.filter(s =>
      (selectedEarningRule === 'all' || s.earning_rule_id === selectedEarningRule) &&
      (selectedCardDefinition === 'all' || s.card_definition_id === selectedCardDefinition)
    );
  });

  // Derived KPIs from daily data
  const dailyKpis = $derived.by(() => {
    const sumKey = (k) => chartData.reduce((s, d) => s + (d[k] || 0), 0);
    return [
      { label: 'Earning Events', value: sumKey('success_count'), colorClass: 'text-info' },
      { label: 'Confirmed Points', value: sumKey('points'), colorClass: 'text-primary' },
      { label: 'Pending Points', value: sumKey('pending_points'), colorClass: 'text-warning' },
    ];
  });

  // Derived KPIs from summary data
  const summaryKpis = $derived.by(() => {
    const sumKey = (k) => summaryData.reduce((s, d) => s + (d[k] || 0), 0);
    return [
      { label: 'All-Time Earning Events', value: sumKey('success_count'), colorClass: 'text-info' },
      { label: 'All-Time Confirmed Points', value: sumKey('points'), colorClass: 'text-primary' },
      { label: 'All-Time Pending Points', value: sumKey('pending_points'), colorClass: 'text-warning' },
    ];
  });

  // Derived comparison rows (for BarComparison - always unfiltered to show all rules)
  const pointsRows = $derived(
    allSummaryData.map(s => ({
      id: s.id ?? s.earning_rule_id,
      label: s.earning_rule_id ?? '—',
      points: s.points,
      pending_points: s.pending_points,
    }))
  );

  $effect(() => {
    if (!programId) return;

    // Reset filter dimensions when program changes
    if (programId !== lastProgramId) {
      hasLoadedDimensions = false;
      allEarningRules = [];
      allCardDefinitions = [];
      allSummaryData = [];
      selectedEarningRule = 'all';
      selectedCardDefinition = 'all';
      lastProgramId = programId;
    }

    const s = startDateStr;
    const e = endDateStr;
    const res = resolution;
    const earningRuleId = selectedEarningRule === 'all' ? null : selectedEarningRule;
    const cardDefId = selectedCardDefinition === 'all' ? null : selectedCardDefinition;
    fetchReports(s, e, res, earningRuleId, cardDefId);
  });

  async function fetchReports(start_date, end_date, res, earning_rule_id = null, card_definition_id = null) {
    loading = true;
    fetchError = null;
    try {
      const dailyParams = {
        start_date,
        end_date,
        resolution: res
      };

      // Only filter daily data by the selected dimensions
      if (earning_rule_id) {
        dailyParams.earning_rule_id = earning_rule_id;
      }
      if (card_definition_id) {
        dailyParams.card_definition_id = card_definition_id;
      }

      // Fetch all filter dimensions once (unfiltered) if not already attempted
      if (!hasLoadedDimensions) {
        try {
          const allSummary = await reportsService.fetchProgramPointsEarningsSummary(programId, {});
          allEarningRules = [...new Set(allSummary.map(s => s.earning_rule_id))].filter(Boolean).sort();
          allCardDefinitions = [...new Set(allSummary.map(s => s.card_definition_id))].filter(Boolean).sort();
          allSummaryData = allSummary; // Keep all summary data for client-side filtering
        } catch (err) {
          // Even if it fails, mark as loaded to prevent infinite retries
          console.error('Failed to load points-earnings filter dimensions:', err);
        } finally {
          hasLoadedDimensions = true; // Mark as loaded even if empty or failed
        }
      }

      // Only fetch daily data (summary is filtered client-side)
      dailyData = await reportsService.fetchProgramPointsEarningsDaily(programId, dailyParams);
    } catch (err) {
      fetchError = err.message || 'Failed to load points-earnings reports';
      dailyData = [];
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between flex-wrap gap-2">
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">
      Points Earnings Reports
    </p>

    <!-- Filter dropdowns at top level -->
    {#if !loading && (earningRules.length > 0 || cardDefinitions.length > 0)}
      <div class="flex items-center gap-2">
        {#if earningRules.length > 0}
          <select
            class="select select-xs select-bordered"
            bind:value={selectedEarningRule}
          >
            <option value="all">All Earning Rules</option>
            {#each earningRules as ruleId (ruleId)}
              <option value={ruleId}>{ruleId}</option>
            {/each}
          </select>
        {/if}
        {#if cardDefinitions.length > 0}
          <select
            class="select select-xs select-bordered"
            bind:value={selectedCardDefinition}
          >
            <option value="all">All Cards</option>
            {#each cardDefinitions as cardDefId (cardDefId)}
              <option value={cardDefId}>{cardDefId}</option>
            {/each}
          </select>
        {/if}
      </div>
    {/if}
  </div>

  {#if loading}
    <div class="flex items-center gap-2 text-base-content/40 text-sm py-6 justify-center">
      <span class="loading loading-spinner loading-sm"></span>Loading reports…
    </div>
  {:else if fetchError}
    <div class="alert alert-error text-xs">{fetchError}</div>
  {:else if !allSummaryData.length && !summaryData.length}
    <p class="text-sm text-base-content/40 py-4 text-center">
      No points-earnings data available for this program.
    </p>
  {:else}
    <!-- All-Time Summary -->
    <div>
      <div class="flex items-center gap-2 mb-2">
        <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest">
          All-Time Summary
        </p>
        {#if selectedEarningRule !== 'all'}
          <span class="badge badge-xs badge-primary font-mono">{selectedEarningRule}</span>
        {/if}
        {#if selectedCardDefinition !== 'all'}
          <span class="badge badge-xs badge-primary font-mono">{selectedCardDefinition}</span>
        {/if}
      </div>
      {#if summaryData.length > 0}
        <KpiTiles tiles={summaryKpis} />
      {:else}
        <p class="text-sm text-base-content/40 py-4 text-center bg-base-200 rounded-lg">
          No data for selected filters.
        </p>
      {/if}
    </div>

    <!-- Per-Rule Breakdown Toggle -->
    {#if allSummaryData.length > 1}
      <div>
        <button
          class="btn btn-sm btn-ghost gap-2"
          onclick={() => showPerRuleBreakdown = !showPerRuleBreakdown}
        >
          <svg
            class="w-4 h-4 transition-transform {showPerRuleBreakdown ? 'rotate-180' : ''}"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          {showPerRuleBreakdown ? 'Hide' : 'Show'} Breakdown by Earning Rule
        </button>

        {#if showPerRuleBreakdown}
          <div class="mt-3">
            <p class="text-[9px] text-base-content/50 mb-2">Points by Earning Rule</p>
            <BarComparison rows={pointsRows} series={POINTS_SERIES} />
          </div>
        {/if}
      </div>
    {/if}

    <!-- Daily Charts Section Header with Controls -->
    <div class="pt-4 border-t border-base-300">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div class="flex items-center gap-2">
          <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest">
            Daily Reports
          </p>
          {#if selectedEarningRule !== 'all'}
            <span class="badge badge-xs badge-primary font-mono">{selectedEarningRule}</span>
          {/if}
          {#if selectedCardDefinition !== 'all'}
            <span class="badge badge-xs badge-primary font-mono">{selectedCardDefinition}</span>
          {/if}
        </div>

        <!-- Date Range and Resolution Controls -->
        <ReportControls bind:rangeDays bind:resolution />
      </div>

      <!-- Daily Period KPIs -->
      {#if dailyData.length > 0 || chartData.length > 0}
        <KpiTiles tiles={dailyKpis} />
      {:else}
        <p class="text-sm text-base-content/40 py-4 text-center bg-base-200 rounded-lg">
          No daily data for selected filters.
        </p>
      {/if}
    </div>

    <!-- Daily Charts -->
    {#if dailyData.length > 0 || chartData.length > 0}
      <StackedBarReportCard
        title="Daily Points Earned"
        chartData={chartData}
        series={POINTS_SERIES}
        resolution={resolution}
      />

      <StackedBarReportCard
        title="Daily Earning Events"
        chartData={chartData}
        series={EVENTS_SERIES}
        resolution={resolution}
      />
    {/if}
  {/if}
</div>
