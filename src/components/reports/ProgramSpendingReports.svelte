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
  let rangeDays = $state(30);
  let resolution = $state('day');
  let selectedCardDefinitionId = $state(null);

  // Data
  let dailyData = $state([]);
  let summaryData = $state([]);
  let loading = $state(false);
  let fetchError = $state(null);

  // Derived date boundaries
  const endDateStr = $derived(fmtISO(new Date()));
  const startDateStr = $derived(fmtISO(new Date(Date.now() - rangeDays * 86_400_000)));

  // Derived chart data with gap filling
  const chartData = $derived(
    fillChartGapsWith(dailyData, startDateStr, endDateStr, resolution, ZERO_RECORD)
  );

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

  // Derived card definition options for filter
  const cardDefOptions = $derived(
    summaryData.map(s => ({
      id: s.card_definition_id,
      label: s.card_definition_id,
    }))
  );

  // Derived comparison rows (for BarComparison)
  const transactionRows = $derived(
    summaryData.map(s => ({
      id: s.card_definition_id,
      label: s.card_definition_id,
      success_on_reward: s.success_on_reward,
      success_on_order: s.success_on_order,
    }))
  );

  const pointsRows = $derived(
    summaryData.map(s => ({
      id: s.card_definition_id,
      label: s.card_definition_id,
      points_on_rewards: s.points_on_rewards,
      points_on_order: s.points_on_order,
    }))
  );

  const amountRows = $derived(
    summaryData.map(s => ({
      id: s.card_definition_id,
      label: s.card_definition_id,
      amount_on_order: s.amount_on_order || 0,
    }))
  );

  $effect(() => {
    if (!programId) return;
    const s = startDateStr;
    const e = endDateStr;
    const res = resolution;
    const cardDefId = selectedCardDefinitionId;
    fetchReports(s, e, res, cardDefId);
  });

  async function fetchReports(start_date, end_date, res, card_definition_id) {
    loading = true;
    fetchError = null;
    try {
      const params = { start_date, end_date, resolution: res };
      if (card_definition_id) {
        params.card_definition_id = card_definition_id;
      }

      const [daily, summary] = await Promise.all([
        reportsService.fetchProgramSpendingDaily(programId, params),
        reportsService.fetchProgramSpendingSummary(
          programId,
          card_definition_id ? { card_definition_id } : {}
        ),
      ]);

      dailyData = daily;
      summaryData = summary;
    } catch (err) {
      fetchError = err.message || 'Failed to load spending reports';
      dailyData = [];
      summaryData = [];
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

    <div class="flex items-center gap-2 flex-wrap">
      <!-- Card Definition Filter -->
      {#if cardDefOptions.length > 0}
        <select
          class="select select-xs select-bordered"
          bind:value={selectedCardDefinitionId}
        >
          <option value={null}>All Cards</option>
          {#each cardDefOptions as opt (opt.id)}
            <option value={opt.id}>{opt.label}</option>
          {/each}
        </select>
      {/if}

      <ReportControls bind:rangeDays bind:resolution />
    </div>
  </div>

  {#if loading}
    <div class="flex items-center gap-2 text-base-content/40 text-sm py-6 justify-center">
      <span class="loading loading-spinner loading-sm"></span>Loading reports…
    </div>
  {:else if fetchError}
    <div class="alert alert-error text-xs">{fetchError}</div>
  {:else if !chartData.length && !summaryData.length}
    <p class="text-sm text-base-content/40 py-4 text-center">
      No spending data available for this program.
    </p>
  {:else}
    <!-- Daily Range KPIs -->
    <div>
      <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest mb-2">
        Period Summary ({rangeDays} days)
      </p>
      <KpiTiles tiles={dailyKpis} />
    </div>

    <!-- Transaction Chart -->
    <StackedBarReportCard
      title="Daily Spending Transactions"
      chartData={chartData}
      series={TRANSACTION_SERIES}
      resolution={resolution}
    />

    <!-- Points Chart -->
    <StackedBarReportCard
      title="Daily Points Spent"
      chartData={chartData}
      series={POINTS_SERIES}
      resolution={resolution}
    />

    <!-- Amount Chart -->
    <StackedBarReportCard
      title="Daily Amount on Orders"
      chartData={chartData}
      series={AMOUNT_SERIES}
      resolution={resolution}
    />

    <!-- Summary Section -->
    {#if summaryData.length > 0}
      <div class="border-t border-base-300 pt-4 mt-2">
        <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest mb-2">
          All-Time Summary
        </p>
        <KpiTiles tiles={summaryKpis} />

        {#if summaryData.length > 1}
          <div class="mt-4">
            <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-widest mb-2">
              By Card Definition
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</div>
