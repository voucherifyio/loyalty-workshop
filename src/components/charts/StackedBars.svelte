<script>
  /**
   * Renders pre-computed stacked bar segments.
   * Each segment: { key, date, y0, y1 } where y0/y1 are domain values.
   * Positive bars: y0=base, y1=base+value
   * Negative bars: y0=base, y1=base-value
   */
  import { getContext } from 'svelte';

  const { xScale, yScale, width } = getContext('LayerCake');

  let {
    segments = [],
    colors = {},
    xKey = 'date',
  } = $props();

  function bw() {
    return $xScale.bandwidth ? Math.max($xScale.bandwidth() - 1, 1) : 4;
  }
</script>

<g class="stacked-bars">
  <!-- Zero baseline -->
  {#if $yScale(0) !== undefined}
    <line
      x1={0}
      x2={$width}
      y1={$yScale(0)}
      y2={$yScale(0)}
      style="stroke: color-mix(in oklch, var(--color-base-content) 25%, transparent)"
    />
  {/if}

  {#each segments as seg}
    {@const x = $xScale(seg[xKey])}
    {@const y_hi = Math.min($yScale(seg.y0), $yScale(seg.y1))}
    {@const y_lo = Math.max($yScale(seg.y0), $yScale(seg.y1))}
    {@const h = Math.max(y_lo - y_hi, 1)}
    {#if x !== undefined}
      <rect
        x={x}
        y={y_hi}
        width={bw()}
        height={h}
        style="fill: {colors[seg.key] ?? 'var(--color-primary)'}"
      />
    {/if}
  {/each}
</g>
