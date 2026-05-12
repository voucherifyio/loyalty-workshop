<script>
  let { startDate = null, endDate = null } = $props();

  const fmt = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const now = Date.now();
  const start = startDate ? new Date(startDate).getTime() : null;
  const end = endDate ? new Date(endDate).getTime() : null;
  const progress = $derived((start && end) ? Math.min(Math.max((now - start) / (end - start), 0), 1) : null);
</script>

<div class="mt-2 mb-3 px-1">
  <div class="relative h-1 bg-base-300 rounded-full w-full my-1.5">
    {#if progress !== null}
      <div class="absolute left-0 top-0 h-full bg-primary/60 rounded-full" style="width: {progress * 100}%"></div>
      <div class="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border-2 border-base-100" style="left: calc({progress * 100}% - 4px)"></div>
    {/if}
    <div class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full {start ? 'bg-base-content/40' : 'bg-base-300'}"></div>
    <div class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full {end ? 'bg-base-content/40' : 'bg-base-300'}"></div>
  </div>
  <div class="flex items-center justify-between text-[10px] font-mono text-base-content/40">
    <span>{start ? fmt(start) : '–'}</span>
    <span>{end ? fmt(end) : '∞'}</span>
  </div>
</div>
