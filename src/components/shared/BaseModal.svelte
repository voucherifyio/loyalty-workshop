<script>
  let {
    open = false,
    size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
    onClose = () => {},
    children
  } = $props();

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  const maxWidthClass = $derived(sizeClasses[size] || sizeClasses.md);
</script>

{#if open}
  <dialog class="modal modal-open">
    <div class="modal-box {maxWidthClass}">
      {@render children()}
    </div>
    <form method="dialog" class="modal-backdrop">
      <button onclick={onClose}>close</button>
    </form>
  </dialog>
{/if}
