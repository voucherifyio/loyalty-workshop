<script>
  let {
    data = null,
    maxHeight = 'max-h-60',
    size = 'xs' // 'xs' | 'sm' | 'base'
  } = $props();

  const sizeClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    base: 'text-sm'
  };

  const textSize = $derived(sizeClasses[size] || sizeClasses.xs);
</script>

<pre class="{textSize} bg-base-200 p-3 rounded overflow-x-auto {maxHeight}">{JSON.stringify(data, null, 2)}</pre>
