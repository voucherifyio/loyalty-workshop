<script>
  let {
    visible = false,
    x = 0,
    y = 0,
    title = '',
    rows = [],   // [{ label, value, color }]
  } = $props();
</script>

{#if visible}
  <div
    class="pointer-events-none absolute z-10 rounded-lg bg-base-100 border border-base-300 shadow-lg px-3 py-2 text-xs min-w-[120px]"
    style="left: {x}px; top: {y}px; transform: translate(-50%, -110%);"
  >
    {#if title}
      <p class="font-semibold text-base-content/70 mb-1">{title}</p>
    {/if}
    {#each rows as row}
      <div class="flex items-center gap-1.5 mt-0.5">
        {#if row.color}
          <span class="inline-block w-2 h-2 rounded-full shrink-0" style="background:{row.color}"></span>
        {/if}
        <span class="text-base-content/60 shrink-0">{row.label}:</span>
        <span class="font-semibold ml-auto pl-2">{row.value}</span>
      </div>
    {/each}
  </div>
{/if}
