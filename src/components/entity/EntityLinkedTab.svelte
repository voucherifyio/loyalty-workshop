<script>
  import StatusBadge from '../StatusBadge.svelte';

  let {
    usedByGroups = [],
    usesGroups = [],
    onNavigate = () => {},
  } = $props();
</script>

{#snippet entityGroupList(groups)}
  <div class="space-y-4">
    {#each groups as group}
      {#if group.items.length > 0}
        <div>
          <h4 class="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-2">
            {group.label}
            <span class="badge badge-xs badge-ghost ml-1 normal-case">{group.items.length}</span>
          </h4>
          <div class="space-y-1">
            {#each group.items as ref (ref.id)}
              <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-base-200 hover:bg-base-300 transition-colors gap-2">
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  {#if ref.status}
                    <StatusBadge status={ref.status} />
                  {/if}
                  <span class="text-sm font-medium truncate">{ref.name || ref.id}</span>
                  {#if ref.name && ref.id !== ref.name}
                    <span class="text-xs font-mono text-base-content/40 truncate hidden sm:block">{ref.id}</span>
                  {/if}
                </div>
                <button
                  class="btn btn-xs btn-ghost shrink-0"
                  onclick={() => onNavigate(group.type, ref.id)}
                >
                  View
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/each}
  </div>
{/snippet}

<div class="flex-1 overflow-y-auto p-4 space-y-6">
  <div>
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">Used By</p>
    {#if usedByGroups.length === 0 || usedByGroups.every(g => g.items.length === 0)}
      <p class="text-xs text-base-content/40 italic">Not referenced by any entity</p>
    {:else}
      {@render entityGroupList(usedByGroups)}
    {/if}
  </div>

  <div class="divider my-0"></div>

  <div>
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">Uses</p>
    {#if usesGroups.length === 0 || usesGroups.every(g => g.items.length === 0)}
      <p class="text-xs text-base-content/40 italic">Does not reference any other entity</p>
    {:else}
      {@render entityGroupList(usesGroups)}
    {/if}
  </div>
</div>
