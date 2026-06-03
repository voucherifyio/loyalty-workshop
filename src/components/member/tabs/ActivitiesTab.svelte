<script>
  import { formatDateTime } from '../../../utils/transactionFormatting.js';
  import SectionHeading from '../../shared/SectionHeading.svelte';
  import ExpandableJsonRow from '../../shared/ExpandableJsonRow.svelte';
  import LoadingState from '../../shared/LoadingState.svelte';
  import EmptyState from '../../shared/EmptyState.svelte';
  import CountBadge from '../../shared/CountBadge.svelte';
  import { getActivityTypeColor } from '../../../utils/activityFormatting.js';

  let {
    isMemberMode = false,
    memberActivities = [],
    cardActivities = [],
    loading = false,
    expandedRows = {},
    onToggleRow,
  } = $props();

  const displayedActivities = $derived(isMemberMode ? memberActivities : cardActivities);

  const JSON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>`;
</script>

<div>
  <div class="flex items-center gap-2 mb-4">
    <SectionHeading>
      {#snippet children()}
        {isMemberMode ? 'Member Activities' : 'Card Activities'}
      {/snippet}
    </SectionHeading>
    {#if displayedActivities.length > 0}
      <CountBadge count={displayedActivities.length} />
    {/if}
  </div>

  {#if loading}
    <LoadingState />
  {:else if displayedActivities.length === 0}
    <EmptyState message="No activities found" />
  {:else}
    <div class="overflow-x-auto">
      <table class="table table-zebra table-xs">
        <thead>
          <tr><th>Date/Time</th><th>Type</th><th>ID</th><th></th></tr>
        </thead>
        <tbody>
          {#each displayedActivities as activity}
            <tr>
              <td class="text-[10px] whitespace-nowrap">{formatDateTime(activity.created_at)}</td>
              <td>
                <span class="badge badge-sm {getActivityTypeColor(activity.type)}">
                  {activity.type || 'UNKNOWN'}
                </span>
              </td>
              <td class="font-mono text-[9px] text-base-content/50">{activity.id}</td>
              <td>
                <button class="btn btn-circle btn-xs btn-ghost" onclick={() => onToggleRow(activity.id)} title="Toggle JSON">
                  {@html JSON_ICON}
                </button>
              </td>
            </tr>
            <ExpandableJsonRow data={activity} colspan={4} expanded={expandedRows[activity.id]} />
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
