<script>
  let {
    displayId = '',
    transitions = [],
    entityType = '',
    onStatusChange = () => {},
    onDelete = null,
    onSwitchToEdit = () => {},
  } = $props();

  let confirmingAction = $state(null);
  let performingAction = $state(false);
  let confirmingDelete = $state(false);
  let deletingEntity = $state(false);

  $effect(() => {
    if (displayId) {
      confirmingAction = null;
      performingAction = false;
      confirmingDelete = false;
      deletingEntity = false;
    }
  });

  async function handleActionConfirm() {
    if (!confirmingAction) return;
    performingAction = true;
    try {
      await onStatusChange(entityType, displayId, confirmingAction.action, confirmingAction.toStatus);
      confirmingAction = null;
    } finally {
      performingAction = false;
    }
  }
</script>

{#if displayId}
  <div class="flex items-center gap-2 px-4 py-2 border-b border-base-300 shrink-0 bg-base-200/40 flex-wrap">
    {#if confirmingAction}
      <span class="text-sm text-base-content/70 flex-1">
        Change to <strong>{confirmingAction.toStatus}</strong>?
      </span>
      <button class="btn btn-xs btn-ghost" onclick={() => confirmingAction = null} disabled={performingAction}>Cancel</button>
      <button class="btn btn-xs btn-primary" onclick={handleActionConfirm} disabled={performingAction}>
        {performingAction ? 'Applying...' : 'Confirm'}
      </button>
    {:else if confirmingDelete}
      <span class="text-sm text-base-content/70 flex-1">Delete this entity permanently?</span>
      <button class="btn btn-xs btn-ghost" onclick={() => confirmingDelete = false} disabled={deletingEntity}>Cancel</button>
      <button
        class="btn btn-xs btn-error"
        onclick={async () => {
          deletingEntity = true;
          try {
            await onDelete(entityType, displayId);
          } finally {
            deletingEntity = false;
            confirmingDelete = false;
          }
        }}
        disabled={deletingEntity}
      >
        {deletingEntity ? 'Deleting...' : 'Delete'}
      </button>
    {:else}
      {#each transitions as transition (transition.action)}
        <button
          class="btn btn-xs {transition.action === 'activate' ? 'btn-success' : transition.action === 'deactivate' ? 'btn-error' : 'btn-warning'}"
          onclick={() => confirmingAction = transition}
        >
          {transition.label}
        </button>
      {/each}

      <button class="btn btn-xs btn-outline" onclick={onSwitchToEdit}>Edit</button>
      <div class="flex-1"></div>

      {#if onDelete}
        <button class="btn btn-xs btn-outline btn-error" onclick={() => confirmingDelete = true}>Delete</button>
      {/if}
    {/if}
  </div>
{/if}
