<script>
  let {
    title = null,
    children
  } = $props();
</script>

<div class="card bg-base-200 p-4">
  {#if title}
    <h3 class="text-sm font-semibold mb-3">{title}</h3>
  {/if}
  {@render children()}
</div>
