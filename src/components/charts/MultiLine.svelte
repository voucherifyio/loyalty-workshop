<script>
  import { getContext } from 'svelte';

  const { data, xScale, yScale } = getContext('LayerCake');

  let {
    series = [],   // [{ key: string, color: string, label: string }]
    xKey = 'date',
    dotRadius = 3,
  } = $props();

  function buildPath(key) {
    const pts = $data
      .filter(d => d[key] != null)
      .map(d => `${$xScale(d[xKey]) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)},${$yScale(d[key])}`);
    if (pts.length < 2) return '';
    return 'M' + pts.join('L');
  }

  function cx(d) {
    return $xScale(d[xKey]) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0);
  }
</script>

<g class="multi-line">
  {#each series as s (s.key)}
    {@const path = buildPath(s.key)}
    {#if path}
      <path
        d={path}
        fill="none"
        style="stroke: {s.color}"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      {#each $data.filter(d => d[s.key] != null) as d (d[xKey])}
        <circle
          cx={cx(d)}
          cy={$yScale(d[s.key])}
          r={dotRadius}
          style="fill: {s.color}; stroke: var(--color-base-200)"
          stroke-width="1.5"
        />
      {/each}
    {/if}
  {/each}
</g>
