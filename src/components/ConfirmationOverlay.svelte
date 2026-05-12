<script>
  let { 
    message = '',
    confirmLabel = 'Confirm',
    variant = 'primary',
    loading = false,
    onConfirm = () => {},
    onCancel = () => {}
  } = $props();
  
  const alertClass = $derived(variant === 'error' ? 'alert-warning' : 'alert-info');
  const buttonClass = $derived(variant === 'error' ? 'btn-error' : 'btn-primary');
</script>

<div class="alert {alertClass}">
  <div class="flex-1">
    <p class="text-xs font-medium mb-2">{message}</p>
    <div class="flex gap-2">
      <button 
        class="btn btn-xs btn-ghost flex-1" 
        onclick={(e) => { e.stopPropagation(); onCancel(); }}
      >
        Cancel
      </button>
      <button 
        class="btn btn-xs {buttonClass} flex-1" 
        onclick={(e) => { e.stopPropagation(); onConfirm(); }}
        disabled={loading}
      >
        {loading ? 'Processing...' : confirmLabel}
      </button>
    </div>
  </div>
</div>
