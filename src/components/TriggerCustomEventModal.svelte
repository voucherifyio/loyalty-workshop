<script>
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { toast } from "../services/toast.js";
  import JsonSchemaEditor from "./JsonSchemaEditor.svelte";

  let {
    open = false,
    customerId = "",
    onClose = () => {},
    onSuccess = () => {},
  } = $props();

  let submitting = $state(false);
  let eventType = $state("");
  let eventMetadata = $state("{}");
  let editorRef = $state(null);

  function resetForm() {
    eventType = "";
    eventMetadata = "{}";
  }

  $effect(() => {
    if (!open) {
      eventMetadata = "{}";
    }
  });

  async function handleSubmit() {
    if (!eventType) {
      toast.error("Please enter an event type");
      return;
    }

    let metadata = {};
    const rawMetadata = editorRef ? editorRef.getValue() : eventMetadata;
    try {
      metadata = JSON.parse(rawMetadata);
    } catch (e) {
      toast.error("Invalid JSON metadata");
      return;
    }

    submitting = true;
    try {
      const payload = {
        customer: customerId,
        type: eventType,
        metadata,
      };

      await api.post(endpoints.events.create(), payload);
      toast.success("Custom event triggered successfully");
      resetForm();
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to trigger event");
    } finally {
      submitting = false;
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-xl">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-lg">Trigger Custom Event</h3>
          <p class="text-sm text-base-content/60 mt-1">
            Customer: <span class="font-mono text-xs">{customerId}</span>
          </p>
        </div>
        <button
          class="btn btn-sm btn-circle btn-ghost"
          onclick={handleClose}
          disabled={submitting}
          aria-label="Close modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div class="card bg-base-200 p-4">
        <div class="space-y-4">
          <input
            type="text"
            class="input input-bordered font-mono w-full"
            bind:value={eventType}
            placeholder="Event type (e.g., customer.custom_event_name)"
          />

          <JsonSchemaEditor
            bind:this={editorRef}
            bind:value={eventMetadata}
            schema={null}
            readonly={submitting}
            height="140px"
          />

          <div class="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="stroke-current shrink-0 w-5 h-5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div class="text-sm">
              <div class="font-semibold mb-1">Earning Rules Trigger</div>
              <div>
                Triggers custom event to activate earning rules configured for
                this event type
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button
          class="btn btn-ghost"
          onclick={handleClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          class="btn btn-primary"
          onclick={handleSubmit}
          disabled={submitting}
        >
          {#if submitting}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            Trigger Event
          {/if}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={handleClose}>close</button>
    </form>
  </dialog>
{/if}
