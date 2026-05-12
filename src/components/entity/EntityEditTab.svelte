<script>
  import { api } from '../../api/client.js';
  import JsonSchemaEditor from '../JsonSchemaEditor.svelte';

  const UPDATE_ALLOWED_KEYS = {
    programs:        ['name', 'start_date', 'end_date', 'metadata'],
    earningRules:    ['name', 'trigger', 'earnings', 'error', 'validity_hours', 'start_date', 'end_date', 'metadata', 'trigger_limits'],
    incentives:      ['name', 'type', 'points', 'points_proportional', 'material', 'digital', 'stock'],
    rewards:         ['name', 'type', 'material', 'digital', 'refunds', 'metadata'],
    cardDefinitions: ['name', 'code_config', 'points_expiration', 'pending_points', 'earning_limits', 'spending_limits', 'refunds', 'balance_settings', 'pay_with_points', 'metadata'],
    tierStructures:  ['name', 'type', 'point_balance', 'point_earned', 'expiration', 'downgrade', 'metadata'],
    tiers:           ['name', 'qualification_rules', 'downgrade', 'metadata'],
  };

  function filterForUpdate(type, data) {
    const keys = UPDATE_ALLOWED_KEYS[type];
    if (!keys || !data) return data;
    return Object.fromEntries(keys.filter(k => k in data).map(k => [k, data[k]]));
  }

  let {
    open = false,
    entityType = '',
    entityId = '',
    entityData = {},
    updateEndpoint = '',
    entityLabel = '',
    onUpdated = () => {},
    onClose = () => {},
  } = $props();

  let jsonInput = $state('');
  let originalJson = $state('');
  let submitting = $state(false);
  let result = $state(null);
  let error = $state(null);
  let jsonError = $state('');
  let updatedSomething = $state(false);
  let editorRef = $state(null);
  let loadingEditData = $state(false);
  let loadedFor = $state(null);

  async function init() {
    result = null;
    error = null;
    jsonError = '';
    updatedSomething = false;
    jsonInput = '';
    originalJson = '';
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

    const filtered = filterForUpdate(entityType, data);
    const formatted = JSON.stringify(filtered, null, 2);
    jsonInput = formatted;
    originalJson = formatted;
  }

  $effect(() => {
    if (open && entityType && entityId && loadedFor !== entityId) init();
  });

  $effect(() => {
    if (!open) {
      loadedFor = null;
    }
  });

  function prettify() {
    jsonError = '';
    if (editorRef) {
      editorRef.prettify();
    } else {
      try {
        const parsed = JSON.parse(jsonInput);
        jsonInput = JSON.stringify(parsed, null, 2);
      } catch (e) {
        jsonError = 'Invalid JSON: ' + e.message;
      }
    }
  }

  function resetToOriginal() {
    jsonInput = originalJson;
    jsonError = '';
    error = null;
  }

  async function handleUpdate() {
    error = null;
    jsonError = '';
    submitting = true;

    const currentValue = editorRef ? editorRef.getValue() : jsonInput;

    try {
      const parsed = JSON.parse(currentValue);
      const response = await api.put(updateEndpoint, parsed);
      result = { success: true, data: response };
      updatedSomething = true;
    } catch (e) {
      if (e.message.includes('Unexpected token') || e.message.includes('JSON')) {
        jsonError = 'Invalid JSON: ' + e.message;
      } else {
        error = e.message;
      }
    } finally {
      submitting = false;
    }
  }

  function handleEditAgain() {
    const formatted = JSON.stringify(result.data, null, 2);
    jsonInput = formatted;
    originalJson = formatted;
    result = null;
    error = null;
    jsonError = '';
  }

  function handleClose() {
    if (updatedSomething) onUpdated();
    onClose();
  }
</script>

<div class="flex-1 overflow-hidden p-4 space-y-3 flex flex-col">
  {#if loadingEditData}
    <div class="flex-1 flex items-center justify-center">
      <span class="loading loading-spinner loading-md text-primary"></span>
    </div>
  {:else}
    <div class="flex justify-between items-center shrink-0">
      <div>
        <h4 class="font-semibold text-sm">JSON Payload</h4>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-xs btn-ghost" onclick={resetToOriginal} disabled={submitting || result?.success}>Reset</button>
        <button class="btn btn-xs btn-outline" onclick={prettify} disabled={submitting || result?.success}>Prettify</button>
      </div>
    </div>

    {#if !result?.success}
      <div class="flex-1 min-h-0">
        <JsonSchemaEditor
          bind:this={editorRef}
          bind:value={jsonInput}
          readonly={submitting}
          height="100%"
        />
      </div>
    {/if}

    {#if result?.success}
      <div class="alert alert-success shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="flex-1">
          <div class="font-bold text-sm">Success!</div>
          <p class="text-xs mt-1">{entityLabel} updated successfully</p>
        </div>
      </div>
      <div class="card bg-base-200 flex-1 min-h-0">
        <div class="card-body p-4 overflow-auto">
          <h5 class="font-bold text-xs mb-2">Response:</h5>
          <pre class="text-xs whitespace-pre-wrap font-mono">{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      </div>
    {:else if jsonError}
      <div class="alert alert-warning shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <div class="flex-1">
          <div class="font-bold text-sm">JSON Error</div>
          <p class="text-xs">{jsonError}</p>
        </div>
      </div>
    {:else if error}
      <div class="alert alert-error shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <div class="flex-1"><div class="font-bold text-sm">API Error</div></div>
      </div>
      <div class="card bg-base-200 shrink-0">
        <div class="card-body p-4">
          <h5 class="font-bold text-xs mb-2">Error Details:</h5>
          <pre class="text-xs whitespace-pre-wrap font-mono overflow-auto max-h-48">{(() => {
            try { return JSON.stringify(JSON.parse(error), null, 2); }
            catch { return error; }
          })()}</pre>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Footer (Edit tab only) -->
<div class="border-t border-base-300 p-4 flex justify-end gap-2 shrink-0">
  {#if result?.success}
    <button type="button" class="btn btn-outline" onclick={handleEditAgain}>Edit Again</button>
    <button type="button" class="btn btn-primary" onclick={handleClose}>Close</button>
  {:else}
    <button type="button" class="btn btn-ghost" onclick={handleClose} disabled={submitting}>Cancel</button>
    <button type="button" class="btn btn-primary" onclick={handleUpdate} disabled={submitting}>
      {submitting ? 'Updating...' : 'Update'}
    </button>
  {/if}
</div>
