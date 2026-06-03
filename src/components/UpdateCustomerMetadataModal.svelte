<script>
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { toast } from "../services/toast.js";
  import BaseModal from "./shared/BaseModal.svelte";
  import ModalHeader from "./shared/ModalHeader.svelte";
  import ModalFooter from "./shared/ModalFooter.svelte";
  import AlertBanner from "./shared/AlertBanner.svelte";
  import FormField from "./shared/FormField.svelte";
  import KeyValueEditor from "./shared/KeyValueEditor.svelte";

  let {
    open = false,
    customerId = "",
    currentMetadata = {},
    onClose = () => {},
    onSuccess = () => {},
  } = $props();

  let submitting = $state(false);
  let metadataEntries = $state([]);

  // Initialize metadata entries from currentMetadata when modal opens
  $effect(() => {
    if (open && currentMetadata && Object.keys(currentMetadata).length > 0) {
      metadataEntries = Object.entries(currentMetadata).map(([key, value]) => ({
        key,
        value: String(value)
      }));
    } else if (open && metadataEntries.length === 0) {
      // Start with one empty entry if no current metadata
      metadataEntries = [{ key: '', value: '' }];
    }
  });

  function resetForm() {
    metadataEntries = [{ key: '', value: '' }];
  }

  async function handleSubmit() {
    // Build metadata object from entries
    const metadata = {};
    metadataEntries.forEach(entry => {
      if (entry.key.trim()) {
        metadata[entry.key] = entry.value;
      }
    });

    if (Object.keys(metadata).length === 0) {
      toast.error("Please add at least one metadata entry");
      return;
    }

    submitting = true;
    try {
      const payload = { metadata };
      
      await api.put(endpoints.customers.update(customerId), payload);
      toast.success("Customer metadata updated successfully");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update customer metadata:', error);
      toast.error("Failed to update customer metadata");
    } finally {
      submitting = false;
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  const subtitle = $derived(`Customer: ${customerId}`);
</script>

<BaseModal {open} size="md" onClose={handleClose}>
  {#snippet children()}
    <ModalHeader
      title="Update Customer Metadata"
      {subtitle}
      onClose={handleClose}
      disabled={submitting}
    />

    <div class="card bg-base-200 p-4">
      <div class="space-y-4">
        <FormField label="Customer Metadata">
          {#snippet children()}
            <KeyValueEditor
              bind:entries={metadataEntries}
              disabled={submitting}
              addButtonLabel="Add Metadata Entry"
            />
          {/snippet}
        </FormField>

        <AlertBanner variant="info" title="Customer Metadata Update">
          {#snippet children()}
            <div class="text-sm">
              Updates the customer's metadata. This will affect earning rule conditions and segmentation that rely on customer metadata.
            </div>
          {/snippet}
        </AlertBanner>
      </div>
    </div>

    <ModalFooter
      confirmLabel="Update Metadata"
      loading={submitting}
      onCancel={handleClose}
      onConfirm={handleSubmit}
    />
  {/snippet}
</BaseModal>
