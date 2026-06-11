<script>
  import * as reportsService from '../../services/reportsService.js';
  import ReportControls from './ReportControls.svelte';
  import KpiTiles from './KpiTiles.svelte';
  import StackedBarReportCard from './StackedBarReportCard.svelte';
  import BarComparison from './BarComparison.svelte';
  import {
    TRANSACTION_SERIES,
    POINTS_SERIES,
    AMOUNT_SERIES,
    ZERO_RECORD,
  } from '../../utils/spendingReportConfig.js';
  import {
    fmtISO,
    fillChartGapsWith,
  } from '../../utils/reportDataTransforms.js';

  let { programId } = $props();

  // Controls
  let rangeDays = $state(7);
  let resolution = $state('day');
  let selectedCardDefinition = $state('all'); // 'all' or specific card_definition_id
  let showPerCardBreakdown = $state(false);

  // Data
  let dailyData = $state([]);
  let allSummaryData = $state([]); // All summary data (unfiltered, used for breakdown comparison and client-side filtering)
  let allCardDefinitions = $state([]); // Keep all card defs for filter dropdown
  let hasLoadedCardDefinitions = $state(false); // Track if we've attempted to load card defs
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

  // Derived list of unique card definitions (from all cards, not filtered)
  const cardDefinitions = $derived(allCardDefinitions);

  // Client-side filtered summary data based on selected card definition
  // This allows instant switching between cards without additional API calls
  const summaryData = $derived.by(() => {
    if (selectedCardDefinition === 'all') {
      return allSummaryData;
    }
    return allSummaryData.filter(s => s.card_definition_id === selectedCardDefinition);
  });

  // Derived KPIs from daily data
  const dailyKpis = $derived.by(() => {
    const sumKey = (k) => chartData.reduce((s, d) => s + (d[k] || 0), 0);
    const totalSuccess = sumKey('success');
    const successReward = sumKey('success_on_reward');
    const successOrder = sumKey('success_on_order');
    const totalPoints = sumKey('points');
    const pointsReward = sumKey('points_on_rewards');
    const pointsOrder = sumKey('points_on_order');
    const amountOrder = sumKey('amount_on_order');

    return [
      { label: 'Total Transactions', value: totalSuccess, colorClass: 'text-primary' },
      { label: 'On Rewards', value: successReward, colorClass: 'text-primary' },
      { label: 'On Orders', value: successOrder, colorClass: 'text-info' },
      { label: 'Total Points', value: totalPoints, colorClass: 'text-primary' },
      { label: 'Points on Rewards', value: pointsReward, colorClass: 'text-primary' },
      { label: 'Points on Orders', value: pointsOrder, colorClass: 'text-info' },
      { label: 'Amount on Orders', value: amountOrder, colorClass: 'text-success' },
    ];
  });

  // Derived KPIs from summary data
  const summaryKpis = $derived.by(() => {
    const sumKey = (k) => summaryData.reduce((s, d) => s + (d[k] || 0), 0);
    const totalSuccess = sumKey('success');
    const successReward = sumKey('success_on_reward');
    const successOrder = sumKey('success_on_order');
    const totalPoints = sumKey('points');
    const pointsReward = sumKey('points_on_rewards');
    const pointsOrder = sumKey('points_on_order');
    const amountOrder = sumKey('amount_on_order');

    return [
      { label: 'All-Time Transactions', value: totalSuccess, colorClass: 'text-primary' },
      { label: 'On Rewards', value: successReward, colorClass: 'text-primary' },
      { label: 'On Orders', value: successOrder, colorClass: 'text-info' },
      { label: 'All-Time Points', value: totalPoints, colorClass: 'text-primary' },
      { label: 'Points on Rewards', value: pointsReward, colorClass: 'text-primary' },
      { label: 'Points on Orders', value: pointsOrder, colorClass: 'text-info' },
      { label: 'All-Time Amount on Orders', value: amountOrder, colorClass: 'text-success' },
    ];
  });

  // Derived comparison rows (for BarComparison - always unfiltered to show all cards)
  const transactionRows = $derived(
    allSummaryData.map(s => ({
      id: s.card_definition_id,
      label: s.card_definition_id,
      success_on_reward: s.success_on_reward,
      success_on_order: s.success_on_order,
    }))
  );

  const pointsRows = $derived(
    allSummaryData.map(s => ({
      id: s.card_definition_id,
      label: s.card_definition_id,
      points_on_rewards: s.points_on_rewards,
      points_on_order: s.points_on_order,
    }))
  );

  const amountRows = $derived(
    allSummaryData.map(s => ({
      id: s.card_definition_id,
      label: s.card_definition_id,
      amount_on_order: s.amount_on_order || 0,
    }))
  );

  $effect(() => {
    if (!programId) return;
    
    // Reset card definitions when program changes
    if (programId !== lastProgramId) {
      hasLoadedCardDefinitions = false;
      allCardDefinitions = [];
      allSummaryData = [];
      selectedCardDefinition = 'all';
      lastProgramId = programId;
    }
    
    const s = startDateStr;
    const e = endDateStr;
    const res = resolution;
    const cardDefId = selectedCardDefinition === 'all' ? null : selectedCardDefinition;
    fetchReports(s, e, res, cardDefId);
  });

  async function fetchReports(start_date, end_date, res, card_definition_id = null) {
    loading = true;
    fetchError = null;
    try {
      const dailyParams = {
        start_date,
        end_date,
        resolution: res
      };
      
      // Only filter daily data by card definition
      if (card_definition_id) {
        dailyParams.card_definition_id = card_definition_id;
      }

      // Fetch all card definitions once (unfiltered) if not already attempted
      if (!hasLoadedCardDefinitions) {
        try {
          const allSummary = await reportsService.fetchProgramSpendingSummary(programId, {});
          const unique = [...new Set(allSummary.map(s => s.card_definition_id))].filter(Boolean);
          allCardDefinitions = unique.sort();
          allSummaryData = allSummary; // Keep all summary data for client-side filtering
        } catch (err) {
          // Even if it fails, mark as loaded to prevent infinite retries
          console.error('Failed to load card definitions:', err);
        } finally {
          hasLoadedCardDefinitions = true; // Mark as loaded even if empty or failed
        }
      }

      // Only fetch daily data (summary is filtered client-side)
      dailyData = await reportsService.fetchProgramSpendingDaily(programId, dailyParams);
    } catch (err) {
      fetchError = err.message || 'Failed to load spending reports';
      dailyData = [];
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between flex-wrap gap-2">
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">
      Spending Reports
    </p>

    <!-- Card Definition Filter at top level -->
    {#if !loading && cardDefinitions.length > 0}
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

  {#if loading}
    <div class="flex items-center gap-2 text-base-content/40 text-sm py-6 justify-center">
      <span class="loading loading-spinner loading-sm"></span>Loading reports…
    </div>
  {:else if fetchError}
    <div class="alert alert-error text-xs">{fetchError}</div>
  {:else if !allSummaryData.length && !summaryData.length}
    <p class="text-sm text-base-content/40 py-4 text-center">
      No spending data available for this program.
    </p>
  {:else}
    <!-- All-Time Summary -->
    <div>
      <div class="flex items-center gap-2 mb-2">
        <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest">
          All-Time Summary
        </p>
        {#if selectedCardDefinition !== 'all'}
          <span class="badge badge-xs badge-primary font-mono">
            {selectedCardDefinition}
          </span>
        {/if}
      </div>
      {#if summaryData.length > 0}
        <KpiTiles tiles={summaryKpis} />
      {:else}
        <p class="text-sm text-base-content/40 py-4 text-center bg-base-200 rounded-lg">
          No data for selected card definition.
        </p>
      {/if}
    </div>

    <!-- Per-Card Breakdown Toggle -->
    {#if allSummaryData.length > 1}
      <div>
        <button 
          class="btn btn-sm btn-ghost gap-2"
          onclick={() => showPerCardBreakdown = !showPerCardBreakdown}
        >
          <svg 
            class="w-4 h-4 transition-transform {showPerCardBreakdown ? 'rotate-180' : ''}"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          {showPerCardBreakdown ? 'Hide' : 'Show'} Breakdown by Card Definition
        </button>
        
        {#if showPerCardBreakdown}
          <div class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p class="text-[9px] text-base-content/50 mb-2">Transactions</p>
              <BarComparison rows={transactionRows} series={TRANSACTION_SERIES} />
            </div>
            <div>
              <p class="text-[9px] text-base-content/50 mb-2">Points</p>
              <BarComparison rows={pointsRows} series={POINTS_SERIES} />
            </div>
            <div>
              <p class="text-[9px] text-base-content/50 mb-2">Amount on Orders</p>
              <BarComparison rows={amountRows} series={AMOUNT_SERIES} />
            </div>
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
          {#if selectedCardDefinition !== 'all'}
            <span class="badge badge-xs badge-primary font-mono">
              {selectedCardDefinition}
            </span>
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
        title="Daily Spending Transactions"
        chartData={chartData}
        series={TRANSACTION_SERIES}
        resolution={resolution}
      />

      <StackedBarReportCard
        title="Daily Points Spent"
        chartData={chartData}
        series={POINTS_SERIES}
        resolution={resolution}
      />

      <StackedBarReportCard
        title="Daily Amount on Orders"
        chartData={chartData}
        series={AMOUNT_SERIES}
        resolution={resolution}
      />
    {/if}
  {/if}
</div>
