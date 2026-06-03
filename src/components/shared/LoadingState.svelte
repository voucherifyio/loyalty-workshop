<script>
  let {
    size = 'md', // 'xs' | 'sm' | 'md' | 'lg'
    message = 'Loading...'
  } = $props();

  const sizeClasses = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  };

  const sizeClass = $derived(sizeClasses[size] || sizeClasses.md);
</script>

<div class="flex flex-col items-center justify-center py-12 gap-3">
  <span class="loading loading-spinner {sizeClass}"></span>
  {#if message}
    <p class="text-sm text-base-content/60">{message}</p>
  {/if}
</div>
