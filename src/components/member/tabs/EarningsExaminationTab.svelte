<script>
  import { api } from '../../../api/client.js';
  import { endpoints } from '../../../api/endpoints.js';
  import { toast } from '../../../services/toast.js';
  import ExaminationResults from '../../examine/ExaminationResults.svelte';
  import ExamineConfigModal from '../../examine/ExamineConfigModal.svelte';
  import TriggerCustomEventModal from '../../TriggerCustomEventModal.svelte';
  import CreateOrderModal from '../../CreateOrderModal.svelte';
  import UpdateCustomerMetadataModal from '../../UpdateCustomerMetadataModal.svelte';

  let {
    programId = '',
    memberId = '',
    member = null
  } = $props();

  // State
  let results = $state(null);
  let loading = $state(false);
  let groupBy = $state('earning_rule');
  let configModalOpen = $state(false);
  let currentPayload = $state(null);
  
  // Modal states for member actions
  let triggerEventOpen = $state(false);
  let createOrderOpen = $state(false);
  let updateMetadataOpen = $state(false);

  // Run ALL scenario on mount
  $effect(() => {
    if (memberId && !results && !loading) {
      runDefaultScenario();
    }
  });

  async function runDefaultScenario() {
    const allTriggersPayload = {
      trigger: { type: 'ALL' },
      customer_identification: { type: 'member_id', member_id: memberId },
      customer_order_paid: {
        order: { amount: 10000 },
        customer: { metadata: {} },
        member: { metadata: {} }
      },
      customer_segment_entered: {
        customer: { metadata: {} },
        member: { metadata: {} }
      },
      customer_custom_event: {
        type: 'ALL',
        all: {
          custom_event: { metadata: {} },
          customer: { metadata: {} },
          member: { metadata: {} }
        }
      }
    };
    await runExamination(allTriggersPayload);
  }

  async function runExamination(payload) {
    loading = true;
    try {
      // Build the request payload - clean it up
      const requestPayload = buildRequestPayload(payload);
      currentPayload = payload;
      
      const response = await api.post(endpoints.examine.run(), requestPayload);
      results = response;
      toast.success('Examination completed');
    } catch (error) {
      console.error('Examination failed:', error);
      toast.error(error.message || 'Examination failed');
    } finally {
      loading = false;
    }
  }

  function buildRequestPayload(payload) {
    const cleaned = JSON.parse(JSON.stringify(payload));
    
    // Convert amount to number if it's a string
    if (cleaned.customer_order_paid?.order?.amount) {
      cleaned.customer_order_paid.order.amount = parseInt(cleaned.customer_order_paid.order.amount);
    }

    // Remove empty metadata objects
    function cleanMetadata(obj) {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(key => {
          if (key === 'metadata' && obj[key] && Object.keys(obj[key]).length === 0) {
            delete obj[key];
          } else if (typeof obj[key] === 'object') {
            cleanMetadata(obj[key]);
          }
        });
      }
    }
    cleanMetadata(cleaned);

    // For SPECIFIC trigger, only include the relevant event data
    if (cleaned.trigger.type === 'SPECIFIC') {
      const event = cleaned.trigger.specific.event;
      if (event === 'customer.order.paid') {
        delete cleaned.customer_segment_entered;
        delete cleaned.customer_custom_event;
      } else if (event === 'customer.segment.entered') {
        delete cleaned.customer_order_paid;
        delete cleaned.customer_custom_event;
      } else if (event === 'customer.custom_event') {
        delete cleaned.customer_order_paid;
        delete cleaned.customer_segment_entered;
      }
    }

    return cleaned;
  }

  function handleExport() {
    if (results) {
      const dataStr = JSON.stringify(results, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `examination-results-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Results exported');
    }
  }

  function handleConfigureScenario() {
    configModalOpen = true;
  }

  function handleModalRun(payload) {
    runExamination(payload);
  }
</script>

<div class="space-y-6">
  <!-- Header with Configure Button -->
  <div class="bg-base-200/50 rounded-xl p-5">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold">Earning Possibilities</h3>
        <p class="text-sm text-base-content/60">
          Examine how different scenarios trigger earning rules and generate points
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
      Trigger operations to test earning scenarios in real-time
    </p>
    <div class="flex gap-3">
      <button
        class="btn btn-outline"
        onclick={() => { triggerEventOpen = true; }}
        disabled={!member}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
        Track Custom Event
      </button>
      <button
        class="btn btn-outline"
        onclick={() => { createOrderOpen = true; }}
        disabled={!member}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
        Create Order
      </button>
      <button
        class="btn btn-outline"
        onclick={() => { updateMetadataOpen = true; }}
        disabled={!member}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Update Customer Metadata
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
      <ExaminationResults
        {results}
        bind:groupBy
        onRunAgain={handleConfigureScenario}
        onExport={handleExport}
      />
    </div>
  {/if}
</div>

<!-- Configuration Modal -->
<ExamineConfigModal
  open={configModalOpen}
  {memberId}
  initialPayload={currentPayload}
  onClose={() => { configModalOpen = false; }}
  onRun={handleModalRun}
/>

<!-- Member Action Modals -->
<TriggerCustomEventModal
  open={triggerEventOpen}
  customerId={member?.customer_id || ''}
  onClose={() => { triggerEventOpen = false; }}
  onSuccess={() => {
    toast.success('Custom event tracked - rerun examination to see updated results');
  }}
/>

<CreateOrderModal
  open={createOrderOpen}
  customerId={member?.customer_id || ''}
  onClose={() => { createOrderOpen = false; }}
  onSuccess={() => {
    toast.success('Order created - rerun examination to see updated results');
  }}
/>

<UpdateCustomerMetadataModal
  open={updateMetadataOpen}
  customerId={member?.customer_id || ''}
  currentMetadata={member?.metadata || {}}
  onClose={() => { updateMetadataOpen = false; }}
  onSuccess={async () => {
    toast.success('Customer metadata updated - refreshing member data');
    // Optionally refresh member data here
  }}
/>
