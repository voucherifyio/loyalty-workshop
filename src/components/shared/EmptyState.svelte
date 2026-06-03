<script>
  let {
    message = 'No data available',
    variant = 'info', // 'info' | 'warning' | 'error'
    size = 'md' // 'sm' | 'md'
  } = $props();

  const sizeClass = $derived(size === 'sm' ? 'text-sm' : '');
</script>

<div class="alert alert-{variant} {sizeClass}">
  <span>{message}</span>
</div>
