<script>
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { toast } from "../services/toast.js";
  import BaseModal from "./shared/BaseModal.svelte";
  import ModalHeader from "./shared/ModalHeader.svelte";
  import ModalFooter from "./shared/ModalFooter.svelte";
  import AlertBanner from "./shared/AlertBanner.svelte";
  import KeyValueEditor from "./shared/KeyValueEditor.svelte";

  let {
    open = false,
    customerId = "",
    onClose = () => {},
    onSuccess = () => {},
  } = $props();

  let submitting = $state(false);
  let eventType = $state("");
  let metadataEntries = $state([{ key: '', value: '' }]);
  let error = $state(null);

  function resetForm() {
    eventType = "";
    metadataEntries = [{ key: '', value: '' }];
    error = null;
  }

  function isValid() {
    return eventType.trim().length > 0;
  }

  async function handleSubmit() {
    if (!isValid()) {
      toast.error("Please enter an event type");
      return;
    }

    submitting = true;
    error = null;

    try {
      // Build metadata object from entries
      const metadata = {};
      metadataEntries.forEach(entry => {
        if (entry.key.trim()) {
          metadata[entry.key] = entry.value;
        }
      });

      const payload = {
        customer: {
          id: customerId
        },
        event: eventType.trim(),
        metadata,
      };

      await api.post(endpoints.events.create(), payload);
      toast.success("Custom event triggered successfully");
      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      error = err.message || "Failed to trigger event";
      toast.error(error);
    } finally {
      submitting = false;
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  $effect(() => {
    if (open) {
      resetForm();
    }
  });

  const subtitle = $derived(`Customer: ${customerId}`);
</script>

<BaseModal {open} size="md" onClose={handleClose}>
  <ModalHeader
    title="Trigger Custom Event"
    {subtitle}
    onClose={handleClose}
    disabled={submitting}
  />

  <div class="space-y-4">
    <div class="card bg-base-200 p-4">
      <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-4 items-start">
        <span class="text-sm text-base-content/70 pt-3">Event Type</span>
        <input
          type="text"
          class="input input-bordered font-mono w-full"
          bind:value={eventType}
          placeholder="e.g., customer.custom_event_name"
          disabled={submitting}
        />

        <span class="text-sm text-base-content/70 pt-2">Event Metadata</span>
        <KeyValueEditor
          bind:entries={metadataEntries}
          disabled={submitting}
          addButtonLabel="Add Metadata Entry"
        />
      </div>
    </div>

    <AlertBanner variant="info" title="Earning Rules Trigger">
      <div class="text-sm">
        Triggers custom event to activate earning rules configured for
        this event type
      </div>
    </AlertBanner>

    {#if error}
      <AlertBanner variant="error" title="Error">
        <pre class="text-xs mt-1">{error}</pre>
      </AlertBanner>
    {/if}
  </div>

  <ModalFooter
    confirmLabel="Trigger Event"
    loading={submitting}
    confirmDisabled={!isValid()}
    onCancel={handleClose}
    onConfirm={handleSubmit}
  />
</BaseModal>
