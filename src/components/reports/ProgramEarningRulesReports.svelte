<script>
  import * as reportsService from '../../services/reportsService.js';
  import ReportControls from './ReportControls.svelte';
  import KpiTiles from './KpiTiles.svelte';
  import StackedBarReportCard from './StackedBarReportCard.svelte';
  import BarComparison from './BarComparison.svelte';
  import {
    OUTCOME_SERIES,
    FAILURE_REASON_SERIES,
    ZERO_RECORD,
  } from '../../utils/earningRulesReportConfig.js';
  import {
    fmtISO,
    fillChartGapsWith,
  } from '../../utils/reportDataTransforms.js';

  let { programId } = $props();

  // Controls
  let rangeDays = $state(7);
  let resolution = $state('day');
  let selectedEarningRule = $state('all'); // 'all' or specific earning_rule_id
  let showPerRuleBreakdown = $state(false);

  // Data
  let dailyData = $state([]);
  let allSummaryData = $state([]); // All summary data (unfiltered, used for breakdown comparison and client-side filtering)
  let allEarningRules = $state([]); // Keep all earning rule ids for filter dropdown
  let hasLoadedEarningRules = $state(false); // Track if we've attempted to load earning rules
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

  // Derived list of unique earning rules (from all rules, not filtered)
  const earningRules = $derived(allEarningRules);

  // Client-side filtered summary data based on selected earning rule
  // This allows instant switching between rules without additional API calls
  const summaryData = $derived.by(() => {
    if (selectedEarningRule === 'all') {
      return allSummaryData;
    }
    return allSummaryData.filter(s => s.earning_rule_id === selectedEarningRule);
  });

  // Derived KPIs from daily data
  const dailyKpis = $derived.by(() => {
    const sumKey = (k) => chartData.reduce((s, d) => s + (d[k] || 0), 0);
    return [
      { label: 'Success', value: sumKey('success_count'), colorClass: 'text-success' },
      { label: 'Failures', value: sumKey('failures_count'), colorClass: 'text-error' },
      { label: 'Cooldown', value: sumKey('failures_cooldown'), colorClass: 'text-warning' },
      { label: 'Frequency', value: sumKey('failures_frequency'), colorClass: 'text-error' },
      { label: 'Earning Limit', value: sumKey('failures_earning_limit'), colorClass: 'text-error' },
    ];
  });

  // Derived KPIs from summary data
  const summaryKpis = $derived.by(() => {
    const sumKey = (k) => summaryData.reduce((s, d) => s + (d[k] || 0), 0);
    return [
      { label: 'All-Time Success', value: sumKey('success_count'), colorClass: 'text-success' },
      { label: 'All-Time Failures', value: sumKey('failures_count'), colorClass: 'text-error' },
      { label: 'Cooldown', value: sumKey('failures_cooldown'), colorClass: 'text-warning' },
      { label: 'Frequency', value: sumKey('failures_frequency'), colorClass: 'text-error' },
      { label: 'Earning Limit', value: sumKey('failures_earning_limit'), colorClass: 'text-error' },
    ];
  });

  // Derived comparison rows (for BarComparison - always unfiltered to show all rules)
  const outcomeRows = $derived(
    allSummaryData.map(s => ({
      id: s.id ?? s.earning_rule_id,
      label: s.earning_rule_id ?? '—',
      success_count: s.success_count,
      failures_count: s.failures_count,
    }))
  );

  $effect(() => {
    if (!programId) return;

    // Reset earning rules when program changes
    if (programId !== lastProgramId) {
      hasLoadedEarningRules = false;
      allEarningRules = [];
      allSummaryData = [];
      selectedEarningRule = 'all';
      lastProgramId = programId;
    }

    const s = startDateStr;
    const e = endDateStr;
    const res = resolution;
    const earningRuleId = selectedEarningRule === 'all' ? null : selectedEarningRule;
    fetchReports(s, e, res, earningRuleId);
  });

  async function fetchReports(start_date, end_date, res, earning_rule_id = null) {
    loading = true;
    fetchError = null;
    try {
      const dailyParams = {
        start_date,
        end_date,
        resolution: res
      };

      // Only filter daily data by earning rule
      if (earning_rule_id) {
        dailyParams.earning_rule_id = earning_rule_id;
      }

      // Fetch all earning rules once (unfiltered) if not already attempted
      if (!hasLoadedEarningRules) {
        try {
          const allSummary = await reportsService.fetchProgramEarningRulesSummary(programId, {});
          const unique = [...new Set(allSummary.map(s => s.earning_rule_id))].filter(Boolean);
          allEarningRules = unique.sort();
          allSummaryData = allSummary; // Keep all summary data for client-side filtering
        } catch (err) {
          // Even if it fails, mark as loaded to prevent infinite retries
          console.error('Failed to load earning rules:', err);
        } finally {
          hasLoadedEarningRules = true; // Mark as loaded even if empty or failed
        }
      }

      // Only fetch daily data (summary is filtered client-side)
      dailyData = await reportsService.fetchProgramEarningRulesDaily(programId, dailyParams);
    } catch (err) {
      fetchError = err.message || 'Failed to load earning rules reports';
      dailyData = [];
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between flex-wrap gap-2">
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">
      Earning Rules Reports
    </p>

    <!-- Earning Rule Filter at top level -->
    {#if !loading && earningRules.length > 0}
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
  </div>

  {#if loading}
    <div class="flex items-center gap-2 text-base-content/40 text-sm py-6 justify-center">
      <span class="loading loading-spinner loading-sm"></span>Loading reports…
    </div>
  {:else if fetchError}
    <div class="alert alert-error text-xs">{fetchError}</div>
  {:else if !allSummaryData.length && !summaryData.length}
    <p class="text-sm text-base-content/40 py-4 text-center">
      No earning rules data available for this program.
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
      </div>
      {#if summaryData.length > 0}
        <KpiTiles tiles={summaryKpis} />
      {:else}
        <p class="text-sm text-base-content/40 py-4 text-center bg-base-200 rounded-lg">
          No data for selected earning rule.
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
            <p class="text-[9px] text-base-content/50 mb-2">Trigger Outcomes by Earning Rule</p>
            <BarComparison rows={outcomeRows} series={OUTCOME_SERIES} />
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
        title="Daily Trigger Outcomes"
        chartData={chartData}
        series={OUTCOME_SERIES}
        resolution={resolution}
      />

      <StackedBarReportCard
        title="Daily Failure Reasons"
        chartData={chartData}
        series={FAILURE_REASON_SERIES}
        resolution={resolution}
      />
    {/if}
  {/if}
</div>
