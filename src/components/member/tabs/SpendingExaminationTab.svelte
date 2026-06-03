<script>
  import { toast } from '../../../services/toast.js';
  import { downloadJson } from '../../../utils/downloadJson.js';
  import * as examinationService from '../../../services/examinationService.js';
  import SpendingResults from '../../examine/SpendingResults.svelte';
  import SpendingConfigModal from '../../examine/SpendingConfigModal.svelte';
  import PurchaseRewardModal from '../../PurchaseRewardModal.svelte';

  let {
    programId = '',
    memberId = '',
    member = null
  } = $props();

  // State
  let results = $state(null);
  let loading = $state(false);
  let groupBy = $state('card');
  let configModalOpen = $state(false);
  let currentPayload = $state(null);
  let manualPurchaseOpen = $state(false);

  // Run basic scenario on mount
  $effect(() => {
    if (memberId && !results && !loading) {
      runDefaultScenario();
    }
  });

  async function runDefaultScenario() {
    const payload = examinationService.createDefaultSpendingPayload(memberId);
    await runExamination(payload);
  }

  async function runExamination(payload) {
    loading = true;
    try {
      currentPayload = payload;
      results = await examinationService.runSpendingExamination(payload);
      toast.success('Examination completed');
    } catch (error) {
      console.error('Examination failed:', error);
      toast.error(error.message || 'Examination failed');
    } finally {
      loading = false;
    }
  }

  function handleExport() {
    if (results) {
      downloadJson(results, `spending-examination-${Date.now()}`);
      toast.success('Results exported');
    }
  }

  function handleConfigureScenario() {
    configModalOpen = true;
  }

  function handleModalRun(payload) {
    runExamination(payload);
  }

  function handlePurchaseSuccess() {
    toast.success('Reward purchased successfully - refreshing examination');
    // Rerun the current examination to refresh results
    if (currentPayload) {
      runExamination(currentPayload);
    } else {
      runDefaultScenario();
    }
  }
</script>

<div class="space-y-6">
  <!-- Header with Configure Button -->
  <div class="bg-base-200/50 rounded-xl p-5">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold">Spending Possibilities</h3>
        <p class="text-sm text-base-content/60">
          Examine available rewards, their costs, and redemption eligibility
        </p>
      </div>
      <button class="btn btn-primary" onclick={handleConfigureScenario} disabled={loading}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Configure Scenario
      </button>
    </div>
  </div>

  <!-- Member Actions Section -->
  <div class="bg-base-200/50 rounded-xl p-5">
    <h4 class="font-bold mb-3">Member Actions</h4>
    <p class="text-sm text-base-content/60 mb-4">
      Manually test reward purchase scenarios
    </p>
    <div class="flex gap-3">
      <button
        class="btn btn-outline"
        onclick={() => { manualPurchaseOpen = true; }}
        disabled={!member}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        Purchase Reward
      </button>
    </div>
  </div>

  <!-- Results -->
  {#if loading}
    <div class="bg-base-200/50 rounded-xl p-12 text-center">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="mt-4 text-base-content/60">Running examination...</p>
    </div>
  {:else}
    <div class="bg-base-200/50 rounded-xl p-5">
      <SpendingResults
        {results}
        {programId}
        {memberId}
        {member}
        bind:groupBy
        onRunAgain={handleConfigureScenario}
        onExport={handleExport}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </div>
  {/if}
</div>

<!-- Configuration Modal -->
<SpendingConfigModal
  open={configModalOpen}
  {memberId}
  initialPayload={currentPayload}
  onClose={() => { configModalOpen = false; }}
  onRun={handleModalRun}
/>

<!-- Manual Purchase Modal -->
<PurchaseRewardModal
  open={manualPurchaseOpen}
  card={member?.cards?.[0] || null}
  {programId}
  {memberId}
  rewardId={null}
  onClose={() => { manualPurchaseOpen = false; }}
  onSuccess={handlePurchaseSuccess}
/>
