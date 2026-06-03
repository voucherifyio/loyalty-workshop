<script>
  import { api } from '../../api/client.js';
  import { formatDate } from '../../utils/transactionFormatting.js';
  import SectionHeading from '../shared/SectionHeading.svelte';
  import ExpandableJsonRow from '../shared/ExpandableJsonRow.svelte';

  let {
    open = false,
    entityId = '',
    activitiesEndpoint = '',
  } = $props();

  let activities = $state([]);
  let loading = $state(false);
  let error = $state(null);
  let expandedActivities = $state({});
  let loadedFor = $state(null);

  function getTypeColor(type) {
    if (!type) return 'badge-neutral';
    const t = String(type).toUpperCase();
    if (t.includes('CREATE')) return 'badge-success';
    if (t.includes('UPDATE') || t.includes('MODIFY')) return 'badge-info';
    if (t.includes('DELETE') || t.includes('REMOVE')) return 'badge-error';
    if (t.includes('ACTIVATE')) return 'badge-primary';
    if (t.includes('DEACTIVATE') || t.includes('DRAFT')) return 'badge-warning';
    if (t.includes('ASSIGN')) return 'badge-accent';
    return 'badge-neutral';
  }

  async function load() {
    if (!activitiesEndpoint) return;
    loading = true;
    error = null;
    activities = [];
    loadedFor = entityId;
    try {
      const response = await api.get(activitiesEndpoint);
      activities = response.data || [];
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (open && entityId && loadedFor !== entityId) load();
  });

  $effect(() => {
    if (!open) {
      loadedFor = null;
      expandedActivities = {};
    }
  });
</script>

<div class="flex-1 overflow-y-auto p-4">
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  {:else if error}
    <div class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 shrink-0">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <span>{error}</span>
    </div>
  {:else if activities.length === 0}
    <div class="alert alert-info"><span>No activities found</span></div>
  {:else}
    <table class="table table-zebra table-xs w-full">
      <thead>
        <tr><th>Date/Time</th><th>Type</th><th></th></tr>
      </thead>
      <tbody>
        {#each activities as activity (activity.id)}
          <tr>
            <td class="text-[10px] whitespace-nowrap">{formatDate(activity.created_at)}</td>
            <td>
              <span class="badge badge-sm {getTypeColor(activity.type)}">
                {activity.type || 'UNKNOWN'}
              </span>
            </td>
            <td>
              <button
                class="btn btn-circle btn-xs btn-ghost"
                onclick={() => expandedActivities[activity.id] = !expandedActivities[activity.id]}
                aria-label="Toggle JSON"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </button>
            </td>
          </tr>
          <ExpandableJsonRow
            data={activity}
            colspan={3}
            expanded={expandedActivities[activity.id]}
          />
        {/each}
      </tbody>
    </table>
  {/if}
</div>
