<script>
  import ActionToolbar from "./ActionToolbar.svelte";
  import ConfirmationOverlay from "./ConfirmationOverlay.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import CopyId from "./CopyId.svelte";
  import FeatureIcons from "./FeatureIcons.svelte";
  import ProgramDateRange from "./ProgramDateRange.svelte";
  let {
    programs = [],
    loading = false,
    loadingMore = {},
    hasMore = {},
    cursorCountdown = {},
    shakeCard = null,
    removingCard = null,
    confirmingDelete = null,
    confirmingStatusChange = null,
    deletingEntity = null,
    changingStatus = null,
    getClasses = () => "",
    getAvailableStatusTransitions = () => [],
    onCreate = () => {},
    onEdit = () => {},
    onSelect = () => {},
    onStartDelete = () => {},
    onCancelDelete = () => {},
    onDelete = () => {},
    onStartStatusChange = () => {},
    onCancelStatusChange = () => {},
    onStatusChange = () => {},
    onExpand = null,
    onLoadMore = () => {},
    onRefresh = () => {},
    onShowMembers = null,
  } = $props();

  let hoveredPrograms = $state(new Set());
</script>

<!-- Programs Section -->
<div>
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    {:else if programs.length === 0}
      <p
        class="text-sm text-base-content/50 text-center py-8 bg-base-200 rounded-lg"
      >
        No programs found
      </p>
    {:else}
      <div class="flex gap-4 overflow-x-auto p-2">
        {#each programs as program}
          {@const pgClasses = getClasses(program)}
          <div
            role="group"
            class="{pgClasses.includes('bg-primary') ? '' : 'bg-base-100'} shadow-sm rounded-lg p-4 transition-all relative {pgClasses} {shakeCard?.type === 'programs' && shakeCard?.id === program.id
              ? 'animate-shake'
              : ''} {removingCard?.type === 'programs' &&
            removingCard?.id === program.id
              ? 'animate-fadeout'
              : ''} min-w-96 shrink-0"
            onmouseenter={() => {
              if (!confirmingDelete && !confirmingStatusChange) {
                hoveredPrograms = new Set(hoveredPrograms).add(program.id);
              }
            }}
            onmouseleave={() => {
              if (!confirmingDelete && !confirmingStatusChange) {
                const newSet = new Set(hoveredPrograms);
                newSet.delete(program.id);
                hoveredPrograms = newSet;
              }
            }}
          >
            {#if confirmingDelete?.type === "programs" && confirmingDelete?.id === program.id}
              <ConfirmationOverlay
                message="Delete '{program.name || program.id}'?"
                confirmLabel={deletingEntity?.type === "programs" && deletingEntity?.id === program.id ? "Deleting..." : "Delete"}
                variant="error"
                loading={deletingEntity?.type === "programs" && deletingEntity?.id === program.id}
                onConfirm={(e) => { e?.stopPropagation?.(); onDelete("programs", program.id); }}
                onCancel={(e) => { e?.stopPropagation?.(); onCancelDelete(); }}
              />
            {:else if confirmingStatusChange?.type === "programs" && confirmingStatusChange?.id === program.id}
              <ConfirmationOverlay
                message="Change status from {confirmingStatusChange.fromStatus} to {confirmingStatusChange.toStatus}?"
                confirmLabel={changingStatus?.type === "programs" && changingStatus?.id === program.id ? "Changing..." : "Confirm"}
                variant="primary"
                loading={changingStatus?.type === "programs" && changingStatus?.id === program.id}
                onConfirm={(e) => { e?.stopPropagation?.(); onStatusChange("programs", program.id, confirmingStatusChange.action, confirmingStatusChange.toStatus); }}
                onCancel={(e) => { e?.stopPropagation?.(); onCancelStatusChange(); }}
              />
            {:else}
              <!-- Action Toolbar -->
              <ActionToolbar
                entityType="programs"
                status={program.status}
                hovered={hoveredPrograms.has(program.id)}
                onStatusChange={(action, toStatus) =>
                  onStartStatusChange(
                    "programs",
                    program.id,
                    program.status,
                    toStatus,
                    action,
                  )}
                onExpand={onExpand ? () => onExpand("programs", program.id) : null}
              />

              <!-- Program Header -->
              <div
                role="button"
                tabindex="0"
                class="cursor-pointer mb-4"
                onclick={() => onSelect(program.id)}
                onkeydown={(e) => e.key === "Enter" && onSelect(program.id)}
              >
                <div class="mb-1">
                  <h3 class="text-base font-bold">
                    {program.name || program.id}
                  </h3>
                </div>
                <div class="flex items-center gap-1.5 mb-2">
                  {#if program.status}<StatusBadge status={program.status} />{/if}
                  <CopyId id={program.id} />
                </div>
              </div>

              <!-- Date range -->
              <ProgramDateRange startDate={program.start_date} endDate={program.end_date} />

              <!-- Members count -->
              <div class="flex items-center justify-center mt-2 pt-2 border-t border-base-300">
                {#if onShowMembers}
                  <button
                    class="flex items-center gap-1.5 text-xs text-base-content/60 hover:text-primary transition-colors cursor-pointer group/members"
                    onclick={(e) => { e.stopPropagation(); onShowMembers(program.id, program.name || program.id); }}
                    title="View members"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3.5 h-3.5 shrink-0">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <span class="font-medium">Members</span>
                    <span class="badge badge-xs badge-ghost group-hover/members:badge-primary transition-colors">
                      {program.membersCount ?? '…'}
                    </span>
                  </button>
                {:else}
                  <span class="text-xs text-base-content/40">Members <span class="badge badge-xs badge-ghost">{program.membersCount ?? '…'}</span></span>
                {/if}
              </div>

              <FeatureIcons entityType="programs" item={program} />

              <!-- Uses (assignment counts) — last row -->
              <div class="flex items-center justify-center gap-3 flex-wrap text-xs text-base-content/60 mt-2 pt-2 border-t border-base-200">
                {#if program.assignments}
                  <span class="text-base-content/40">Uses</span>
                  <span class="font-medium">Cards <span class="badge badge-xs badge-ghost">{program.assignments.cardDefinitions}</span></span>
                  <span class="font-medium">Rules <span class="badge badge-xs badge-ghost">{program.assignments.earningRules}</span></span>
                  <span class="font-medium">Rewards <span class="badge badge-xs badge-ghost">{program.assignments.rewards}</span></span>
                  <span class="font-medium">Tiers <span class="badge badge-xs badge-ghost">{program.assignments.tierStructures}</span></span>
                {:else}
                  <span class="text-base-content/40">Uses nothing</span>
                {/if}
              </div>

            {/if}
          </div>
        {/each}
      </div>

      <!-- Load More / No More Items for Programs -->
      {#if !loading}
        {#if cursorCountdown.programs === "expired" && hasMore.programs}
          <button
            class="btn btn-text btn-xs w-full mt-4 text-warning hover:text-warning"
            onclick={onRefresh}
            disabled={loadingMore.programs}
          >
            {loadingMore.programs
              ? "Refreshing..."
              : "Cursor Expired - Refresh"}
          </button>
        {:else if hasMore.programs}
          <button
            class="btn btn-text btn-xs w-full mt-4 text-base-content/70 hover:text-base-content"
            onclick={onLoadMore}
            disabled={loadingMore.programs}
          >
            {loadingMore.programs
              ? "Loading..."
              : `Load More${cursorCountdown.programs ? ` (${cursorCountdown.programs})` : ""}`}
          </button>
        {/if}
      {/if}
    {/if}
  </div>
