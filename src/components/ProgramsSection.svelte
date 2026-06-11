<script>
  import { SvelteSet } from 'svelte/reactivity';
  import ActionToolbar from "./ActionToolbar.svelte";
  import ConfirmationOverlay from "./ConfirmationOverlay.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import CopyId from "./CopyId.svelte";
  import FeatureIcons from "./FeatureIcons.svelte";
  import ProgramDateRange from "./ProgramDateRange.svelte";
  import CountBadge from "./shared/CountBadge.svelte";
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
    assignmentActive = false,
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
    onNavigate = null,
    onLoadMore = () => {},
    onRefresh = () => {},
  } = $props();

  let hoveredPrograms = $state(new SvelteSet());
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
        {#each programs as program (program.id)}
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
                hoveredPrograms = new SvelteSet(hoveredPrograms).add(program.id);
              }
            }}
            onmouseleave={() => {
              if (!confirmingDelete && !confirmingStatusChange) {
                const newSet = new SvelteSet(hoveredPrograms);
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
                onNavigate={onNavigate ? () => onNavigate(program.id) : null}
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

              <FeatureIcons entityType="programs" item={program} />

              <!-- Uses (assignment counts) — last row -->
              <div class="flex items-center justify-center gap-3 flex-wrap text-xs text-base-content/60 mt-2 pt-2 border-t border-base-200">
                {#if program.assignments}
                  <span class="text-base-content/40">Uses</span>
                  <span class="font-medium">Cards <CountBadge count={program.assignments.cardDefinitions} /></span>
                  <span class="font-medium">Rules <CountBadge count={program.assignments.earningRules} /></span>
                  <span class="font-medium">Rewards <CountBadge count={program.assignments.rewards} /></span>
                  <span class="font-medium">Tiers <CountBadge count={program.assignments.tierStructures} /></span>
                {:else}
                  <span class="text-base-content/40">Uses nothing</span>
                {/if}
              </div>

            {/if}
          </div>
        {/each}
      </div>

      {#if !loading && programs.length > 0}
        <div class="text-center mt-4">
          <div class="inline-flex items-center gap-2 px-4 py-2.5 bg-warning/10 border-2 border-warning/30 rounded-lg {assignmentActive ? 'opacity-40' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-warning">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p class="text-sm font-medium text-warning">
              Click a program to enter assignment mode
            </p>
          </div>
        </div>
      {/if}

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
