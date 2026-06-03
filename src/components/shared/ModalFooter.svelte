<script>
  let {
    cancelLabel = 'Cancel',
    confirmLabel = 'Confirm',
    loading = false,
    confirmDisabled = false,
    variant = 'primary', // 'primary' | 'warning' | 'error'
    onCancel = () => {},
    onConfirm = () => {}
  } = $props();

  const isDisabled = $derived(loading || confirmDisabled);
</script>

<div class="modal-action">
  <button class="btn btn-ghost" onclick={onCancel} disabled={loading}>
    {cancelLabel}
  </button>
  <button
    class="btn btn-{variant}"
    onclick={onConfirm}
    disabled={isDisabled}
  >
    {#if loading}
      <span class="loading loading-spinner loading-sm"></span>
    {:else}
      {confirmLabel}
    {/if}
  </button>
</div>
