<script>
  let {
    count = 0,
    label = '',
    variant = 'ghost', // 'ghost' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'
    size = 'xs', // 'xs' | 'sm' | 'md' | 'lg'
    className = ''
  } = $props();

  const sizeClass = $derived(`badge-${size}`);
  const variantClass = $derived(variant ? `badge-${variant}` : '');
  const fullClass = $derived(`badge ${sizeClass} ${variantClass} ${className}`.trim());
</script>

<span class={fullClass}>
  {#if label}{label} {/if}{count}
</span>
