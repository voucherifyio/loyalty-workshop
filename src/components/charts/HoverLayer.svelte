<script>
  /**
   * Transparent SVG rect that tracks the hovered band-scale bucket.
   * Uses the LayerCake context for xScale, width, height, and data.
   * Calls onhover({ bucket, clientX, clientY }) and onleave().
   */
  import { getContext } from 'svelte';

  const { xScale, width, height, data } = getContext('LayerCake');

  let {
    onhover = () => {},
    onleave = () => {},
  } = $props();

  function findBucket(mouseX) {
    const domain = $xScale.domain();
    if (!domain.length) return null;
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < domain.length; i++) {
      const bandX = $xScale(domain[i]);
      const center = bandX + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0);
      const dist = Math.abs(mouseX - center);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    return $data[closestIdx] ?? null;
  }

  function handleMouseMove(e) {
    // offsetX is relative to the SVG inner area (post-padding), so it's already in data space
    const bucket = findBucket(e.offsetX);
    if (bucket) onhover({ bucket, clientX: e.clientX, clientY: e.clientY });
  }
</script>

<!-- Transparent overlay — must be last child so it sits on top of bars/lines -->
<rect
  x={0}
  y={0}
  width={$width}
  height={$height}
  fill="transparent"
  style="cursor: crosshair"
  onmousemove={handleMouseMove}
  onmouseleave={onleave}
/>
