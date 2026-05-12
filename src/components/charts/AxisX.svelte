<script>
  import { getContext } from 'svelte';

  const { width, height, xScale } = getContext('LayerCake');

  let {
    ticks = undefined,
    formatTick = (d) => d,
    gridlines = true,
  } = $props();

  const tickValues = $derived.by(() => {
    if (Array.isArray(ticks)) return ticks;
    if ($xScale.ticks) return $xScale.ticks(ticks ?? Math.min(Math.floor($width / 80), 8));
    return $xScale.domain();
  });
</script>

<g class="axis-x" transform="translate(0, {$height})">
  {#if gridlines}
    {#each tickValues as tick}
      <line
        x1={$xScale(tick)}
        x2={$xScale(tick)}
        y1={0}
        y2={-$height}
        style="stroke: color-mix(in oklch, var(--color-base-content) 8%, transparent)"
        stroke-dasharray="3,3"
      />
    {/each}
  {/if}

  <line
    x1={0}
    x2={$width}
    y1={0}
    y2={0}
    style="stroke: color-mix(in oklch, var(--color-base-content) 20%, transparent)"
  />

  {#each tickValues as tick}
    {@const x = $xScale(tick) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)}
    <g transform="translate({x}, 0)">
      <line
        y1={0}
        y2={4}
        style="stroke: color-mix(in oklch, var(--color-base-content) 30%, transparent)"
      />
      <text
        y={14}
        text-anchor="middle"
        dominant-baseline="hanging"
        font-size="9"
        style="fill: color-mix(in oklch, var(--color-base-content) 50%, transparent)"
      >{formatTick(tick)}</text>
    </g>
  {/each}
</g>
