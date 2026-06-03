<script>
  import { api } from "../api/client.js";
  import { getEditableProperties } from '../config/entityProperties.js';
  import { buildCreatePayload } from '../utils/stateAwarePayload.js';
  import RewardCostsEditor from './RewardCostsEditor.svelte';
  import EarningRulesEarningsEditor from './EarningRulesEarningsEditor.svelte';

  let {
    open = false,
    entityType = "",
    entityLabel = "",
    samplePayload = "",
    createEndpoint = "",
    cardDefinitions = [],
    incentives = [],
    tierStructures = [],
    onClose = () => {},
    onCreated = () => {},
  } = $props();

  let formData = $state({});
  let submitting = $state(false);
  let result = $state(null);
  let error = $state(null);
  let createdSomething = $state(false);
  let hasInitialized = $state(false);

  const createState = 'DRAFT';
  
  // State for costs editor modal
  let costsEditorOpen = $state(false);
  let costsBeingEdited = $state(null);
  
  // State for earnings editor modal
  let earningsEditorOpen = $state(false);
  let earningsBeingEdited = $state(null);

  let editableFields = $derived(
    Object.entries(getEditableProperties(entityType, createState))
  );

  // Display state for textarea values (what user sees/types)
  // Initialized on open, then maintained manually in handleInput
  let displayData = $state({});

  function initForm() {
    // Initialize from sample
    try {
      const sample = samplePayload ? JSON.parse(samplePayload) : {};
      formData = {};
      displayData = {};
      const properties = getEditableProperties(entityType, createState);
      for (const fieldName of Object.keys(properties)) {
        let value = sample[fieldName] !== undefined ? sample[fieldName] : '';
        
        // Set default values for specific fields
        if (fieldName === 'status' && !value) {
          value = 'DRAFT';
        }
        if (entityType === 'cardDefinitions' && fieldName === 'type' && !value) {
          value = 'INDIVIDUAL';
        }
        
      formData[fieldName] = value;
      // Initialize display data
      // Check if field is datetime type
      const fieldConfig = properties[fieldName];
      if (fieldConfig?.type === 'datetime') {
        // For datetime fields, convert ISO to datetime-local format
        displayData[fieldName] = toDateTimeLocalValue(value);
      } else if (typeof value === 'object' && value !== null) {
        displayData[fieldName] = JSON.stringify(value, null, 2);
      } else {
        displayData[fieldName] = String(value || '');
      }
      }
    } catch {
      formData = {};
      displayData = {};
      const properties = getEditableProperties(entityType, createState);
      for (const fieldName of Object.keys(properties)) {
        // Set default values even in error case
        let value = '';
        if (fieldName === 'status') {
          value = 'DRAFT';
        }
        if (entityType === 'cardDefinitions' && fieldName === 'type') {
          value = 'INDIVIDUAL';
        }
        
        formData[fieldName] = value;
        displayData[fieldName] = value;
      }
    }
    result = null;
    error = null;
    createdSomething = false;
  }

  $effect(() => {
    if (open && entityType && !hasInitialized) {
      initForm();
      hasInitialized = true;
    }
  });

  $effect(() => {
    if (!open) {
      hasInitialized = false;
    }
  });

  function handleInput(fieldName, newValue) {
    // Update display data immediately
    displayData[fieldName] = newValue;
    
    const trimmed = newValue.trim();
    
    // Handle empty values
    if (!trimmed) {
      formData[fieldName] = '';
      return;
    }
    
    // Check if this field is defined as JSON type in entity properties
    const properties = getEditableProperties(entityType, createState);
    const fieldConfig = properties[fieldName];
    const isJsonField = fieldConfig?.type === 'json';
    
    // For JSON fields, try to parse
    if (isJsonField) {
      try {
        formData[fieldName] = JSON.parse(newValue);
      } catch (err) {
        // Invalid JSON - could be mid-typing, so we'll keep it as string temporarily
        // The payload builder will exclude it if it's still invalid when submitting
        formData[fieldName] = newValue;
      }
    } else {
      // For non-JSON fields
      try {
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          formData[fieldName] = JSON.parse(newValue);
        } else {
          formData[fieldName] = newValue;
        }
      } catch {
        formData[fieldName] = newValue;
      }
    }
  }

  // Handle datetime input and convert to ISO format
  function handleDateTimeInput(fieldName, newValue) {
    // displayData stores the datetime-local format (YYYY-MM-DDThh:mm)
    displayData[fieldName] = newValue;
    
    if (!newValue) {
      formData[fieldName] = '';
    } else {
      // Convert from datetime-local format (YYYY-MM-DDThh:mm) to ISO 8601
      formData[fieldName] = new Date(newValue).toISOString();
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

  async function handleSend() {
    error = null;
    submitting = true;

    try {
      // Parse any JSON fields that are still strings before building payload
      const properties = getEditableProperties(entityType, createState);
      const jsonFields = Object.keys(properties).filter(key => properties[key]?.type === 'json');
      const parsedFormData = { ...formData };
      
      for (const fieldName of jsonFields) {
        if (fieldName in parsedFormData) {
          const value = parsedFormData[fieldName];
          // If it's a string, try to parse it
          if (typeof value === 'string' && value.trim()) {
            try {
              parsedFormData[fieldName] = JSON.parse(value);
            } catch (err) {
              // Invalid JSON - show error and don't submit
              error = `Invalid JSON in field "${fieldName}": ${err.message}`;
              return;
            }
          }
        }
      }
      
      const payload = buildCreatePayload(entityType, parsedFormData);
      const response = await api.post(createEndpoint, payload);
      result = { success: true, data: response };
      createdSomething = true;
    } catch (e) {
      error = e.message;
    } finally {
      submitting = false;
    }
  }

  function handleCreateAnother() {
    initForm();
  }

  function handleClose() {
    if (createdSomething) onCreated();
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

<div 
  class="fixed top-0 right-0 h-full w-[650px] bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out {open ? 'translate-x-0' : 'translate-x-full'} flex flex-col"
>
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-base-300">
    <h3 class="font-bold text-lg">Create {entityLabel}</h3>
    <button class="btn btn-sm btn-circle btn-ghost" onclick={handleClose} aria-label="Close drawer">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-hidden p-4 flex flex-col gap-4">
    {#if !result?.success}
      <!-- Simple 2-column grid -->
      <div class="flex-1 overflow-auto">
        <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-xs">
          {#each editableFields as [fieldName, fieldConfig]}
            {@const isRewardCosts = entityType === 'rewards' && fieldName === 'costs'}
            {@const isEarningRuleEarnings = entityType === 'earningRules' && fieldName === 'earnings'}
            {@const isDateTimeField = fieldConfig?.type === 'datetime'}
            
            <span class="text-base-content/50 pt-2">{fieldName}</span>
            
            {#if isDateTimeField}
              <!-- Datetime picker for start_date and end_date -->
              <div class="flex items-center gap-2">
                <input
                  type="datetime-local"
                  class="input input-sm input-bordered font-mono text-xs w-full"
                  value={displayData[fieldName] || ''}
                  oninput={(e) => handleDateTimeInput(fieldName, e.target.value)}
                  disabled={submitting}
                />
                {#if displayData[fieldName]}
                  <button
                    type="button"
                    class="btn btn-sm btn-ghost btn-circle shrink-0"
                    onclick={() => handleDateTimeInput(fieldName, '')}
                    disabled={submitting}
                    title="Clear date"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>
            {:else if isRewardCosts}
              <!-- Special editor for reward costs -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline flex-1 justify-start font-mono text-xs"
                  onclick={() => openCostsEditor(fieldName)}
                  disabled={submitting}
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
                    disabled={submitting}
                    title="Clear costs"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              {/if}
            </div>
            {:else if isEarningRuleEarnings}
              <!-- Special editor for earning rules earnings -->
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline flex-1 justify-start font-mono text-xs"
                  onclick={() => openEarningsEditor(fieldName)}
                  disabled={submitting}
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
                    disabled={submitting}
                    title="Clear earnings"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>
            {:else}
              <!-- Standard textarea for other fields -->
              <textarea
                class="textarea textarea-bordered textarea-sm font-mono text-xs leading-tight"
                rows="3"
                value={displayData[fieldName] || ''}
                oninput={(e) => handleInput(fieldName, e.target.value)}
                disabled={submitting}
              ></textarea>
            {/if}
          {/each}
        </div>
      </div>
    {:else}
      <!-- Success -->
      <div class="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <div class="font-bold text-sm">Success!</div>
          <p class="text-xs mt-1">{entityLabel} created successfully</p>
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
      <button type="button" class="btn btn-outline btn-sm" onclick={handleCreateAnother}>Create Another</button>
      <button type="button" class="btn btn-primary btn-sm" onclick={handleClose}>Close</button>
    {:else}
      <button type="button" class="btn btn-ghost btn-sm" onclick={handleClose} disabled={submitting}>Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" onclick={handleSend} disabled={submitting}>
        {submitting ? "Sending..." : "Send"}
      </button>
    {/if}
  </div>
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
