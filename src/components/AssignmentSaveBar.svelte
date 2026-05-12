<script>
  let {
    active = false,
    pendingChanges = { toAssign: {}, toUnassign: {} },
    onSave = () => {},
    onDiscard = () => {},
  } = $props();

  let saving = $state(false);

  const totalAssign = $derived(
    Object.values(pendingChanges.toAssign).reduce((sum, arr) => sum + arr.length, 0)
  );
  const totalUnassign = $derived(
    Object.values(pendingChanges.toUnassign).reduce((sum, arr) => sum + arr.length, 0)
  );

  async function handleSave() {
    saving = true;
    try {
      await onSave();
    } finally {
      saving = false;
    }
  }
</script>

{#if active}
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-base-100/90 backdrop-blur-md border border-base-300 shadow-xl rounded-2xl px-5 py-3">
    <div class="flex items-center gap-2 text-sm">
      <span class="font-semibold text-base-content/70">Unsaved changes:</span>
      {#if totalAssign > 0}
        <span class="badge badge-success badge-sm">+{totalAssign} assigned</span>
      {/if}
      {#if totalUnassign > 0}
        <span class="badge badge-error badge-sm">-{totalUnassign} unassigned</span>
      {/if}
    </div>
    <div class="w-px h-6 bg-base-300"></div>
    <button
      class="btn btn-ghost btn-sm text-base-content/60"
      onclick={onDiscard}
      disabled={saving}
    >
      Discard
    </button>
    <button
      class="btn btn-primary btn-sm"
      onclick={handleSave}
      disabled={saving}
    >
      {#if saving}
        <span class="loading loading-spinner loading-xs"></span>
        Saving...
      {:else}
        Save Assignments
      {/if}
    </button>
  </div>
{/if}
