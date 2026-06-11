<script>
  import { 
    RESOLUTION_OPTIONS, 
    RANGE_OPTIONS_BY_RESOLUTION,
  } from '../../utils/reportChartConfig.js';

  let { rangeDays = $bindable(), resolution = $bindable() } = $props();

  // Track previous resolution to detect changes
  let previousResolution = $state(resolution);

  // Get range options for current resolution
  const rangeOptions = $derived(RANGE_OPTIONS_BY_RESOLUTION[resolution] || RANGE_OPTIONS_BY_RESOLUTION.day);
  
  // Auto-select first option when resolution changes
  $effect(() => {
    if (resolution !== previousResolution) {
      previousResolution = resolution;
      // Set to first option of the new resolution
      if (rangeOptions.length > 0) {
        rangeDays = rangeOptions[0].days;
      }
    }
  });
</script>

<div class="flex items-center gap-2 flex-wrap">
  <!-- Range presets -->
  <div class="join">
    {#each rangeOptions as opt (opt.days)}
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
