<script>
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { toast } from "../services/toast.js";

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

  function addMetadataEntry() {
    metadataEntries = [...metadataEntries, { key: '', value: '' }];
  }

  function removeMetadataEntry(index) {
    metadataEntries = metadataEntries.filter((_, i) => i !== index);
    if (metadataEntries.length === 0) {
      metadataEntries = [{ key: '', value: '' }];
    }
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
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-bold text-lg">Update Customer Metadata</h3>
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
          <div>
            <label class="label">
              <span class="label-text font-medium">Customer Metadata</span>
            </label>
            <div class="space-y-2">
              {#each metadataEntries as entry, i}
                <div class="flex gap-2 items-center">
                  <input
                    type="text"
                    class="input input-sm input-bordered flex-1 font-mono"
                    bind:value={entry.key}
                    placeholder="Key"
                    disabled={submitting}
                  />
                  <input
                    type="text"
                    class="input input-sm input-bordered flex-1 font-mono"
                    bind:value={entry.value}
                    placeholder="Value"
                    disabled={submitting}
                  />
                  <button
                    class="btn btn-sm btn-ghost btn-square"
                    onclick={() => removeMetadataEntry(i)}
                    disabled={submitting}
                    title="Remove entry"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      class="w-4 h-4"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              {/each}
              <button
                class="btn btn-sm btn-outline w-full"
                onclick={addMetadataEntry}
                disabled={submitting}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add Metadata Entry
              </button>
            </div>
          </div>

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
              <div class="font-semibold mb-1">Customer Metadata Update</div>
              <div>
                Updates the customer's metadata. This will affect earning rule conditions and segmentation that rely on customer metadata.
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
            Update Metadata
          {/if}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={handleClose}>close</button>
    </form>
  </dialog>
{/if}
