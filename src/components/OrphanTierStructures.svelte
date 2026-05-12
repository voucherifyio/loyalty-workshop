<script>
  import StatusBadge from './StatusBadge.svelte';

  let {
    tierStructures = [],
    entityUsage = {},
    onEdit = () => {},
    onDelete = () => {},
  } = $props();
</script>

{#if tierStructures.length > 0}
  <div class="mt-4 bg-base-200/50 border border-base-300 rounded-lg p-4">
    <div class="flex items-center gap-2 mb-3">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5 text-base-content/50">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
      <h4 class="text-sm font-semibold">Global Tier Structures ({tierStructures.length})</h4>
    </div>
    <div class="space-y-2">
      {#each tierStructures as ts}
        <div class="bg-base-100 rounded p-2 text-xs flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-semibold truncate">{ts.name || ts.id}</span>
              <StatusBadge status={ts.status} />
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button class="btn btn-circle btn-xs btn-ghost" onclick={() => onEdit('tierStructures', ts.id)} title="Edit" aria-label="Edit tier structure">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
              <button class="btn btn-circle btn-xs btn-ghost" onclick={() => onDelete('tierStructures', ts.id)} title="Delete" aria-label="Delete tier structure">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
          <div class="flex items-center justify-center gap-2 pt-2 border-t border-base-300 text-[10px] text-base-content/60">
            {#if entityUsage.tierStructures?.[ts.id] > 0}
              <span class="font-medium">Used by <span class="badge badge-xs badge-ghost">{entityUsage.tierStructures[ts.id]}</span></span>
            {:else}
              <span class="badge badge-xs badge-ghost">Not used</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
