<script>
  import { getContext } from 'svelte';

  const { width, height, yScale } = getContext('LayerCake');

  let {
    ticks = undefined,
    formatTick = (d) => d,
    gridlines = true,
  } = $props();

  const tickCount = $derived(ticks ?? Math.min(Math.floor($height / 40), 6));
  const tickValues = $derived($yScale.ticks ? $yScale.ticks(tickCount) : $yScale.domain());
</script>

<g class="axis-y">
  {#if gridlines}
    {#each tickValues as tick (tick)}
      <line
        x1={0}
        x2={$width}
        y1={$yScale(tick)}
        y2={$yScale(tick)}
        style="stroke: color-mix(in oklch, var(--color-base-content) 8%, transparent)"
        stroke-dasharray="3,3"
      />
    {/each}
  {/if}

  {#if tickValues.includes(0)}
    <line
      x1={0}
      x2={$width}
      y1={$yScale(0)}
      y2={$yScale(0)}
      style="stroke: color-mix(in oklch, var(--color-base-content) 25%, transparent)"
    />
  {/if}

  {#each tickValues as tick (tick)}
    <text
      x={-6}
      y={$yScale(tick)}
      text-anchor="end"
      dominant-baseline="middle"
      font-size="9"
      style="fill: color-mix(in oklch, var(--color-base-content) 50%, transparent)"
    >{formatTick(tick)}</text>
  {/each}
</g>
