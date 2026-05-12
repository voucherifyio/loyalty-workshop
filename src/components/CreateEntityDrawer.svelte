<script>
  import { api } from "../api/client.js";
  import JsonSchemaEditor from "./JsonSchemaEditor.svelte";

  let {
    open = false,
    entityType = "",
    entityLabel = "",
    samplePayload = "",
    createEndpoint = "",
    onClose = () => {},
    onCreated = () => {},
  } = $props();

  let jsonInput = $state("");
  let submitting = $state(false);
  let result = $state(null);
  let error = $state(null);
  let jsonError = $state("");
  let createdSomething = $state(false);
  let editorRef = $state(null);

  // Reset form when drawer opens or entityType changes
  $effect(() => {
    if (open && entityType) {
      // Read samplePayload explicitly so this effect tracks it
      const payload = samplePayload || "{}";
      jsonInput = payload;
      result = null;
      error = null;
      jsonError = "";
      createdSomething = false;
    }
  });

  function prettify() {
    jsonError = "";
    if (editorRef) {
      editorRef.prettify();
    } else {
      try {
        const parsed = JSON.parse(jsonInput);
        jsonInput = JSON.stringify(parsed, null, 2);
      } catch (e) {
        jsonError = "Invalid JSON: " + e.message;
      }
    }
  }

  async function handleSend() {
    error = null;
    jsonError = "";
    submitting = true;

    const currentValue = editorRef ? editorRef.getValue() : jsonInput;

    try {
      const parsed = JSON.parse(currentValue);
      const response = await api.post(createEndpoint, parsed);
      result = { success: true, data: response };
      createdSomething = true;
    } catch (e) {
      if (
        e.message.includes("Unexpected token") ||
        e.message.includes("JSON")
      ) {
        jsonError = "Invalid JSON: " + e.message;
      } else {
        error = e.message;
      }
    } finally {
      submitting = false;
    }
  }

  function handleCreateAnother() {
    jsonInput = samplePayload;
    result = null;
    error = null;
    jsonError = "";
  }

  function handleClose() {
    if (createdSomething) {
      onCreated();
    }
    onClose();
  }
</script>

<!-- Drawer Panel -->
<div 
  class="fixed top-0 right-0 h-full w-[650px] bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out {open ? 'translate-x-0' : 'translate-x-full'} flex flex-col"
>
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b border-base-300">
    <div class="flex items-center gap-2">
      <h3 class="font-bold text-lg">Create {entityLabel}</h3>
    </div>
    <button
      class="btn btn-sm btn-circle btn-ghost"
      onclick={handleClose}
      aria-label="Close drawer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Content -->
  <div class="flex-1 overflow-hidden p-4 space-y-3 flex flex-col">
    <!-- Toolbar -->
    <div class="flex justify-between items-center shrink-0">
      <div>
        <h4 class="font-semibold text-sm">JSON Payload</h4>
      </div>
      <button
        class="btn btn-xs btn-outline"
        onclick={prettify}
        disabled={submitting || result?.success}
      >
        Prettify
      </button>
    </div>

    <!-- Monaco Editor -->
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

    <!-- Results Section -->
    {#if result?.success}
      <div class="alert alert-success shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 shrink-0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div class="flex-1">
          <div class="font-bold text-sm">Success!</div>
          <p class="text-xs mt-1">{entityLabel} created successfully</p>
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 shrink-0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <div class="flex-1">
          <div class="font-bold text-sm">JSON Error</div>
          <p class="text-xs">{jsonError}</p>
        </div>
      </div>
    {:else if error}
      <div class="alert alert-error shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 shrink-0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <div class="flex-1">
          <div class="font-bold text-sm">API Error</div>
        </div>
      </div>
      <div class="card bg-base-200 shrink-0">
        <div class="card-body p-4">
          <h5 class="font-bold text-xs mb-2">Error Details:</h5>
          <pre class="text-xs whitespace-pre-wrap font-mono overflow-auto max-h-48">{(() => {
            try {
              return JSON.stringify(JSON.parse(error), null, 2);
            } catch {
              return error;
            }
          })()}</pre>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer Actions -->
  <div class="border-t border-base-300 p-4 flex justify-end gap-2 shrink-0">
    {#if result?.success}
      <button
        type="button"
        class="btn btn-outline"
        onclick={handleCreateAnother}
      >
        Create Another
      </button>
      <button type="button" class="btn btn-primary" onclick={handleClose}>
        Close
      </button>
    {:else}
      <button
        type="button"
        class="btn btn-ghost"
        onclick={handleClose}
        disabled={submitting}
      >
        Cancel
      </button>
      <button
        type="button"
        class="btn btn-primary"
        onclick={handleSend}
        disabled={submitting}
      >
        {submitting ? "Sending..." : "Send"}
      </button>
    {/if}
  </div>
</div>
