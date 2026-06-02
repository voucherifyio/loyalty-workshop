<script>
  import { api } from '../../api/client.js';
  import { getEntityProperties } from '../../config/entityProperties.js';
  import { buildUpdatePayload } from '../../utils/stateAwarePayload.js';
  import RewardCostsEditor from '../RewardCostsEditor.svelte';
  import EarningRulesEarningsEditor from '../EarningRulesEarningsEditor.svelte';

  let {
    open = false,
    entityType = '',
    entityId = '',
    entityData = {},
    updateEndpoint = '',
    entityLabel = '',
    parentStatus = null,
    cardDefinitions = [],
    incentives = [],
    tierStructures = [],
    onUpdated = () => {},
    onClose = () => {},
  } = $props();

  let formData = $state({});
  let submitting = $state(false);
  let result = $state(null);
  let error = $state(null);
  let fieldErrors = $state({}); // Track field-specific errors
  let updatedSomething = $state(false);
  let loadingEditData = $state(false);
  let loadedFor = $state(null);
  let entityState = $state('DRAFT');
  
  // State for costs editor modal
  let costsEditorOpen = $state(false);
  let costsBeingEdited = $state(null);
  
  // State for earnings editor modal
  let earningsEditorOpen = $state(false);
  let earningsBeingEdited = $state(null);

  // Determine effective state for property filtering
  // For tiers, use parent tier structure status; for others, use entity's own status
  const effectiveState = $derived(
    (entityType === 'tiers' && parentStatus) ? parentStatus : entityState
  );

  // Get all fields for this entity type
  let allFields = $derived(
    Object.entries(getEntityProperties(entityType)).filter(([key]) => !key.startsWith('_'))
  );

  // Check if a field is editable using effective state
  function isFieldEditable(fieldConfig) {
    return fieldConfig.states.includes(effectiveState);
  }

  // Get tooltip for disabled fields
  function getDisabledTooltip(fieldConfig) {
    if (fieldConfig.states.includes(effectiveState)) return '';
    
    if (entityType === 'tiers' && parentStatus) {
      const allowedStates = fieldConfig.states.join(', ');
      return `Parent Tier Structure is ${parentStatus}: only ${allowedStates} fields can be edited`;
    }
    
    const allowedStates = fieldConfig.states.join(', ');
    if (fieldConfig.states.includes('DRAFT') && !fieldConfig.states.includes('ACTIVE')) {
      return 'Only editable in DRAFT state';
    }
    return `Only editable in: ${allowedStates}`;
  }

  async function init() {
    result = null;
    error = null;
    fieldErrors = {};
    updatedSomething = false;
    formData = {};
    loadedFor = entityId;

    let data = entityData;
    if (!data || Object.keys(data).length === 0) {
      if (!updateEndpoint) return;
      loadingEditData = true;
      try {
        data = await api.get(updateEndpoint);
      } catch (e) {
        error = e.message;
        loadingEditData = false;
        return;
      }
      loadingEditData = false;
    }

    entityState = data.status || 'DRAFT';
    
    // Initialize ALL fields (not just editable ones) for display
    const properties = getEntityProperties(entityType);
    for (const fieldName of Object.keys(properties)) {
      // Skip metadata fields (fields starting with _)
      if (fieldName.startsWith('_')) continue;
      formData[fieldName] = data[fieldName] !== undefined ? data[fieldName] : '';
    }
  }

  $effect(() => {
    if (open && entityType && entityId && loadedFor !== entityId) init();
  });

  $effect(() => {
    if (!open) loadedFor = null;
  });

  // Convert formData to display strings for textareas
  let displayData = $state({});
  
  $effect(() => {
    // When formData changes, update display strings
    const newDisplay = {};
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'object' && value !== null) {
        newDisplay[key] = JSON.stringify(value, null, 2);
      } else {
        newDisplay[key] = String(value || '');
      }
    }
    displayData = newDisplay;
  });

  function handleInput(fieldName, newValue) {
    // Try to parse as JSON, fallback to string
    try {
      const trimmed = newValue.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        formData[fieldName] = JSON.parse(newValue);
      } else {
        formData[fieldName] = newValue;
      }
    } catch {
      // Invalid JSON, keep as string
      formData[fieldName] = newValue;
    }
    displayData[fieldName] = newValue;
    
    // Clear field error when user edits
    if (fieldErrors[fieldName]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[fieldName];
      fieldErrors = newErrors;
    }
  }

  // Handle datetime input and convert to ISO format
  function handleDateTimeInput(fieldName, newValue) {
    if (!newValue) {
      formData[fieldName] = '';
      displayData[fieldName] = '';
    } else {
      // Convert from datetime-local format (YYYY-MM-DDThh:mm) to ISO 8601
      formData[fieldName] = new Date(newValue).toISOString();
      displayData[fieldName] = newValue;
    }
    
    // Clear field error when user edits
    if (fieldErrors[fieldName]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[fieldName];
      fieldErrors = newErrors;
    }
  }

  // Convert ISO date to datetime-local format (YYYY-MM-DDThh:mm)
  function toDateTimeLocalValue(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      // Format: YYYY-MM-DDThh:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  }
  
  // Parse validation errors from API response
  function parseFieldErrors(errorMessage) {
    const errors = {};
    
    // Match patterns like "Property .field_name" or "Property .field_name.nested"
    const propertyRegex = /Property\s+\.([a-zA-Z_][a-zA-Z0-9_.]*)/g;
    let match;
    
    while ((match = propertyRegex.exec(errorMessage)) !== null) {
      const fullPath = match[1]; // e.g., "pay_with_points.type" or "pay_with_points"
      const rootField = fullPath.split('.')[0]; // Get the root field name
      
      // Extract the relevant error message for this property
      // Find the sentence containing this property reference
      const sentences = errorMessage.split(/[.!]\s+/);
      for (const sentence of sentences) {
        if (sentence.includes(`Property .${fullPath}`)) {
          errors[rootField] = sentence.trim();
          break;
        }
      }
    }
    
    return errors;
  }

  async function handleUpdate() {
    error = null;
    fieldErrors = {};
    submitting = true;

    try {
      const payload = buildUpdatePayload(entityType, entityState, formData, null, parentStatus);
      const response = await api.put(updateEndpoint, payload);
      result = { success: true, data: response };
      updatedSomething = true;
    } catch (e) {
      error = e.message;
      // Parse field-specific errors from the error message
      fieldErrors = parseFieldErrors(e.message);
    } finally {
      submitting = false;
    }
  }

  function handleEditAgain() {
    const data = result.data;
    entityState = data.status || entityState;
    
    // Initialize ALL fields for display
    const properties = getEntityProperties(entityType);
    for (const fieldName of Object.keys(properties)) {
      // Skip metadata fields (fields starting with _)
      if (fieldName.startsWith('_')) continue;
      formData[fieldName] = data[fieldName] !== undefined ? data[fieldName] : '';
    }
    
    result = null;
    error = null;
    fieldErrors = {};
  }

  function handleClose() {
    if (updatedSomething) onUpdated();
    onClose();
  }

  function openCostsEditor(fieldName) {
    costsBeingEdited = fieldName;
    costsEditorOpen = true;
  }

  function closeCostsEditor() {
    costsEditorOpen = false;
    costsBeingEdited = null;
  }

  function saveCosts(costs) {
    if (costsBeingEdited) {
      formData[costsBeingEdited] = costs;
      // Update display data
      displayData[costsBeingEdited] = JSON.stringify(costs, null, 2);
    }
    closeCostsEditor();
  }

  function openEarningsEditor(fieldName) {
    earningsBeingEdited = fieldName;
    earningsEditorOpen = true;
  }

  function closeEarningsEditor() {
    earningsEditorOpen = false;
    earningsBeingEdited = null;
  }

  function saveEarnings(earnings) {
    if (earningsBeingEdited) {
      formData[earningsBeingEdited] = earnings;
      // Update display data
      displayData[earningsBeingEdited] = JSON.stringify(earnings, null, 2);
    }
    closeEarningsEditor();
  }
</script>

<div class="flex-1 overflow-hidden p-4 flex flex-col gap-4">
  {#if loadingEditData}
    <div class="flex-1 flex items-center justify-center">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>
  {:else if !result?.success}
    <!-- State indicator -->
    <div class="text-xs text-base-content/60">
      {#if entityType === 'tiers' && parentStatus}
        Parent Tier Structure Status: <span class="badge badge-sm badge-outline">{parentStatus}</span>
        <span class="text-base-content/40 ml-2">Tier editability controlled by parent Tier Structure status</span>
      {:else}
        Status: <span class="badge badge-sm badge-outline">{entityState}</span>
        <span class="text-base-content/40 ml-2">Disabled fields cannot be edited in {entityState} state</span>
      {/if}
    </div>

    <!-- Simple 2-column grid like Details tab -->
    <div class="flex-1 overflow-auto">
      <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-xs">
        {#each allFields as [fieldName, fieldConfig]}
          {@const editable = isFieldEditable(fieldConfig)}
          {@const tooltip = getDisabledTooltip(fieldConfig)}
          {@const hasError = fieldErrors[fieldName]}
          {@const isRewardCosts = entityType === 'rewards' && fieldName === 'costs'}
          {@const isEarningRuleEarnings = entityType === 'earningRules' && fieldName === 'earnings'}
          {@const isDateTimeField = fieldName === 'start_date' || fieldName === 'end_date'}
          
          <span class="text-base-content/50 pt-2 {!editable ? 'opacity-50' : ''} {hasError ? 'text-error' : ''}">{fieldName}</span>
          
          <div class="relative">
            {#if isDateTimeField}
              <!-- Datetime picker for start_date and end_date -->
              <div class="flex items-center gap-2">
                <input
                  type="datetime-local"
                  class="input input-sm input-bordered font-mono text-xs w-full {!editable ? 'cursor-not-allowed opacity-60' : ''} {hasError ? 'input-error border-error' : ''}"
                  value={toDateTimeLocalValue(formData[fieldName])}
                  oninput={(e) => handleDateTimeInput(fieldName, e.target.value)}
                  disabled={submitting || !editable}
                  title={tooltip}
                />
                {#if formData[fieldName]}
                  <button
                    type="button"
                    class="btn btn-sm btn-ghost btn-circle shrink-0"
                    onclick={() => handleDateTimeInput(fieldName, '')}
                    disabled={submitting || !editable}
                    title="Clear date"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>
              {#if !editable}
                <div class="absolute top-1 right-1 tooltip tooltip-left" data-tip={tooltip}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-warning">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              {/if}
            {:else if isRewardCosts}
              <!-- Special editor for reward costs -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline flex-1 justify-start font-mono text-xs {!editable ? 'btn-disabled' : ''}"
                  onclick={() => openCostsEditor(fieldName)}
                  disabled={submitting || !editable}
                  title={tooltip || 'Open costs editor'}
                >
                  {#if formData[fieldName]?.length}
                    {formData[fieldName].length} cost{formData[fieldName].length !== 1 ? 's' : ''} configured
                  {:else}
                    Configure costs
                  {/if}
                </button>
                {#if formData[fieldName]?.length}
                  <button
                    type="button"
                    class="btn btn-sm btn-ghost btn-circle"
                    onclick={() => { formData[fieldName] = []; displayData[fieldName] = '[]'; }}
                    disabled={submitting || !editable}
                    title="Clear costs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>
              {#if !editable}
                <div class="absolute top-1 right-1 tooltip tooltip-left" data-tip={tooltip}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-warning">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              {/if}
            {:else if isEarningRuleEarnings}
              <!-- Special editor for earning rules earnings -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline flex-1 justify-start font-mono text-xs {!editable ? 'btn-disabled' : ''}"
                  onclick={() => openEarningsEditor(fieldName)}
                  disabled={submitting || !editable}
                  title={tooltip || 'Open earnings editor'}
                >
                  {#if formData[fieldName]?.length}
                    {formData[fieldName].length} earning block{formData[fieldName].length !== 1 ? 's' : ''} configured
                  {:else}
                    Configure earnings
                  {/if}
                </button>
                {#if formData[fieldName]?.length}
                  <button
                    type="button"
                    class="btn btn-sm btn-ghost btn-circle"
                    onclick={() => { formData[fieldName] = []; displayData[fieldName] = '[]'; }}
                    disabled={submitting || !editable}
                    title="Clear earnings"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>
              {#if !editable}
                <div class="absolute top-1 right-1 tooltip tooltip-left" data-tip={tooltip}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-warning">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              {/if}
            {:else}
              <!-- Standard textarea for other fields -->
              <textarea
                class="textarea textarea-bordered textarea-sm font-mono text-xs leading-tight w-full {!editable ? 'cursor-not-allowed opacity-60' : ''} {hasError ? 'textarea-error border-error' : ''}"
                rows="3"
                value={displayData[fieldName] || ''}
                oninput={(e) => handleInput(fieldName, e.target.value)}
                disabled={submitting || !editable}
                title={tooltip}
              ></textarea>
              {#if !editable}
                <div class="absolute top-1 right-1 tooltip tooltip-left" data-tip={tooltip}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-warning">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
              {/if}
            {/if}
            {#if hasError}
              <div class="text-error text-[10px] mt-1">
                {fieldErrors[fieldName]}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Success message -->
    <div class="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="flex-1">
        <div class="font-bold text-sm">Success!</div>
        <p class="text-xs mt-1">{entityLabel} updated successfully</p>
      </div>
    </div>
    <div class="flex-1 overflow-auto">
      <pre class="text-xs font-mono bg-base-200 rounded-lg p-3 whitespace-pre-wrap">{JSON.stringify(result.data, null, 2)}</pre>
    </div>
  {/if}

  {#if error}
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <div class="flex-1">
        <div class="font-bold text-sm">Error</div>
        <pre class="text-xs mt-1 whitespace-pre-wrap">{error}</pre>
      </div>
    </div>
  {/if}
</div>

<!-- Footer -->
<div class="border-t border-base-300 p-4 flex justify-end gap-2">
  {#if result?.success}
    <button type="button" class="btn btn-outline btn-sm" onclick={handleEditAgain}>Edit Again</button>
    <button type="button" class="btn btn-primary btn-sm" onclick={handleClose}>Close</button>
  {:else}
    <button type="button" class="btn btn-ghost btn-sm" onclick={handleClose} disabled={submitting}>Cancel</button>
    <button type="button" class="btn btn-primary btn-sm" onclick={handleUpdate} disabled={submitting}>
      {submitting ? 'Updating...' : 'Update'}
    </button>
  {/if}
</div>

{#if costsEditorOpen && costsBeingEdited}
  <RewardCostsEditor
    initialCosts={formData[costsBeingEdited] || []}
    availableCardDefinitions={cardDefinitions}
    availableTierStructures={tierStructures}
    onSave={saveCosts}
    onCancel={closeCostsEditor}
  />
{/if}

{#if earningsEditorOpen && earningsBeingEdited}
  <EarningRulesEarningsEditor
    initialEarnings={formData[earningsBeingEdited] || []}
    availableCardDefinitions={cardDefinitions}
    availableIncentives={incentives}
    availableTierStructures={tierStructures}
    onSave={saveEarnings}
    onCancel={closeEarningsEditor}
  />
{/if}
