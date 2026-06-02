<script>
  import SpendingPayloadBuilder from './SpendingPayloadBuilder.svelte';
  import SpendingScenarioPresets from './SpendingScenarioPresets.svelte';

  let {
    open = false,
    memberId = '',
    initialPayload = null,
    onClose = () => {},
    onRun = (payload) => {}
  } = $props();

  let payload = $state(null);

  // Initialize payload when modal opens
  $effect(() => {
    if (open && initialPayload) {
      payload = JSON.parse(JSON.stringify(initialPayload));
    } else if (open && !payload) {
      payload = {
        customer_identification: { type: 'member_id', member_id: memberId },
        customer: { metadata: {} },
        member: { metadata: {} }
      };
    }
  });

  function handlePresetSelected(presetPayload) {
    payload = presetPayload;
  }

  function handleRun() {
    if (payload) {
      onRun(payload);
      onClose();
    }
  }

  function handleCancel() {
    onClose();
  }
</script>

{#if open}
  <div class="modal modal-open">
    <div class="modal-box max-w-4xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold">Configure Examination Scenario</h3>
        <button class="btn btn-sm btn-circle btn-ghost" onclick={handleCancel}>✕</button>
      </div>

      <div class="space-y-6">
        <!-- Scenario Presets -->
        <SpendingScenarioPresets {memberId} onPresetSelected={handlePresetSelected} />

        <!-- Payload Builder -->
        {#if payload}
          <SpendingPayloadBuilder
            {memberId}
            bind:payload
          />
        {/if}
      </div>

      <!-- Actions -->
      <div class="modal-action">
        <button class="btn btn-outline" onclick={handleCancel}>Cancel</button>
        <button
          class="btn btn-primary"
          onclick={handleRun}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Run Examination
        </button>
      </div>
    </div>
    <div class="modal-backdrop" onclick={handleCancel}></div>
  </div>
{/if}
