<script>
  import { RANGE_OPTIONS, RESOLUTION_OPTIONS } from '../../utils/reportChartConfig.js';

  let { rangeDays = $bindable(), resolution = $bindable() } = $props();
</script>

<div class="flex items-center gap-2 flex-wrap">
  <!-- Range presets -->
  <div class="join">
    {#each RANGE_OPTIONS as opt (opt.days)}
      <button
        class="join-item btn btn-xs {rangeDays === opt.days ? 'btn-primary' : 'btn-ghost'}"
        onclick={() => { rangeDays = opt.days; }}
      >
        {opt.label}
      </button>
    {/each}
  </div>

  <!-- Resolution selector -->
  <select
    class="select select-xs select-bordered"
    bind:value={resolution}
  >
    {#each RESOLUTION_OPTIONS as opt (opt.value)}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
</div>
