<script>
  import { featureChecks } from '../config/designerConfig.js';

  let { entityType = '', item = {}, compact = false } = $props();

  const features = $derived(featureChecks[entityType] ?? []);
</script>

{#if features.length > 0}
  <div class="flex items-center justify-center gap-1 flex-wrap {compact ? '' : 'mt-2 pt-2 border-t border-base-200'}">
    {#each features as feature}
      {@const active = feature.check(item)}
      <div
        class="tooltip tooltip-bottom {compact ? 'tooltip-xs' : ''}"
        data-tip="{feature.label}{active ? '' : ' (default)'}"
      >
        <div
          class="rounded {compact ? 'w-3.5 h-3.5 p-px' : 'w-5 h-5 p-0.5'} flex items-center justify-center transition-all {active ? 'bg-primary/20 text-primary' : 'bg-base-200 text-base-content/20'}"
        >
          {@html feature.icon}
        </div>
      </div>
    {/each}
  </div>
{/if}
