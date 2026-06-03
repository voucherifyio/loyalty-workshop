<script>
  import BaseModal from '../shared/BaseModal.svelte';
  import ModalHeader from '../shared/ModalHeader.svelte';
  import ExaminePayloadBuilder from './ExaminePayloadBuilder.svelte';
  import ExamineScenarioPresets from './ExamineScenarioPresets.svelte';

  let {
    open = false,
    memberId = '',
    initialPayload = null,
    onClose = () => {},
    onRun = (payload) => {}
  } = $props();

  let payload = $state(null);
  let isPayloadValid = $state(false);

  // Initialize payload when modal opens
  $effect(() => {
    if (open && initialPayload) {
      payload = JSON.parse(JSON.stringify(initialPayload));
    } else if (open && !payload) {
      payload = {
        trigger: { type: 'SPECIFIC', specific: { event: 'customer.order.paid' } },
        customer_identification: { type: 'member_id', member_id: memberId },
        customer_order_paid: {
          order: { amount: '' },
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
    }
  });

  function handleValidationChange(valid) {
    isPayloadValid = valid;
  }

  function handlePresetSelected(presetPayload) {
    payload = presetPayload;
  }

  function handleRun() {
    if (isPayloadValid && payload) {
      onRun(payload);
      onClose();
    }
  }

  function handleCancel() {
    onClose();
  }
</script>

<BaseModal {open} size="lg" onClose={handleCancel}>
  <ModalHeader title="Configure Examination Scenario" onClose={handleCancel} />

  <div class="space-y-6">
    <!-- Scenario Presets -->
    <ExamineScenarioPresets {memberId} onPresetSelected={handlePresetSelected} />

    <!-- Payload Builder -->
    {#if payload}
      <ExaminePayloadBuilder
        {memberId}
        bind:payload
        onValidationChange={handleValidationChange}
      />
    {/if}
  </div>

  <!-- Actions -->
  <div class="modal-action">
    <button class="btn btn-outline" onclick={handleCancel}>Cancel</button>
    <button
      class="btn btn-primary"
      onclick={handleRun}
      disabled={!isPayloadValid}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
      Run Examination
    </button>
  </div>
</BaseModal>
