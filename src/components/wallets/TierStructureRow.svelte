<script>
  import ConfirmationOverlay from "../ConfirmationOverlay.svelte";
  import CountBadge from "../shared/CountBadge.svelte";

  let {
    tierStructure,
    expandedTiers = [],
    loading = false,
    assignmentActive = false,
    isAssigned = false,
    hovered = false,
    entityUsage = {},
    shakeCard = null,
    removingCard = null,
    confirmingStatusChange = null,
    changingStatus = false,
    getClasses = () => "",
    onSelect = () => {},
    onExpand = null,
    onCreateTier = () => {},
    onEditTier = () => {},
    onDeleteTier = () => {},
    onToggleAssignment = () => {},
    onStartStatusChange = () => {},
    onConfirmStatusChange = () => {},
    onCancelStatusChange = () => {},
  } = $props();

  const statusColor = $derived(
    tierStructure.status === "ACTIVE"
      ? "bg-success"
      : tierStructure.status === "INACTIVE"
        ? "bg-error"
        : "bg-warning"
  );

  const tierFallbackColors = [
    "#6b7280",
    "#8b5cf6",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#ef4444",
  ];

  const sortedTiers = $derived(
    [...expandedTiers].sort(
      (a, b) =>
        (a.qualification_rules?.points.min_value ?? 0) -
        (b.qualification_rules?.points.min_value ?? 0),
    )
  );

  const visualMax = $derived.by(() => {
    const knownMaxValues = sortedTiers
      .map((t) => t.qualification_rules?.points.max_value)
      .filter((v) => v != null);
    const highestKnownMax =
      knownMaxValues.length > 0 ? Math.max(...knownMaxValues) : 0;
    return highestKnownMax > 0
      ? highestKnownMax * 1.35
      : (sortedTiers.at(-1)?.qualification_rules?.points.min_value ?? 0) * 1.35 || 1000;
  });
</script>

<div
  class="rounded-lg border border-dashed border-base-300 bg-base-200/25 p-3 transition-all {getClasses(
    'tierStructures',
    tierStructure,
  )} {shakeCard?.type === 'tierStructures' &&
  shakeCard?.id === tierStructure.id
    ? 'animate-shake'
    : ''} {removingCard?.type === 'tierStructures' &&
  removingCard?.id === tierStructure.id
    ? 'animate-fadeout'
    : ''} {assignmentActive && isAssigned
    ? 'border-primary/45 bg-primary/5 ring-1 ring-primary/35'
    : ''}"
  role="group"
>
  {#if confirmingStatusChange}
    <ConfirmationOverlay
      message="Change status from {confirmingStatusChange.fromStatus} to {confirmingStatusChange.toStatus}?"
      confirmLabel={changingStatus ? "Changing..." : "Confirm"}
      variant="primary"
      {loading}
      onConfirm={onConfirmStatusChange}
      onCancel={onCancelStatusChange}
    />
  {:else}
    <!-- Compact single-line row: [radio?] [status dot] name + badge … [actions right] -->
    <div class="flex items-center gap-1.5 mb-1 w-full min-w-0">
      {#if assignmentActive}
        <input
          type="radio"
          class="radio radio-primary radio-xs shrink-0"
          checked={isAssigned}
          onchange={onToggleAssignment}
          title="Only one tier structure can be assigned per program"
        />
      {/if}
      <span class="w-1.5 h-1.5 rounded-full shrink-0 {statusColor}"></span>
      <div class="flex min-w-0 flex-1 items-center gap-1.5">
        <button
          class="text-xs font-semibold text-left truncate hover:text-primary transition-colors cursor-pointer min-w-0"
          onclick={() => onSelect("tierStructures", tierStructure.id)}
          title={tierStructure.name || tierStructure.id}
        >
          {tierStructure.name || tierStructure.id}
        </button>
        {#if tierStructure.type}
          <span
            class="badge badge-xs badge-ghost font-mono shrink-0 text-[8px]"
            >{tierStructure.type === "POINT_BALANCE"
              ? "Balance"
              : tierStructure.type === "POINT_EARNED"
                ? "Earned"
                : tierStructure.type}</span
          >
        {/if}
      </div>
      <!-- Action buttons -->
      <div
        class="join join-horizontal ml-auto shrink-0 rounded-lg bg-base-100/90 transition-opacity {hovered
          ? 'opacity-100'
          : 'opacity-0'}"
      >
        {#if tierStructure.status === "ACTIVE"}
          <button
            class="btn btn-xs btn-circle join-item btn-error tooltip tooltip-bottom"
            data-tip="Deactivate"
            aria-label="Deactivate"
            onclick={(e) => {
              e.stopPropagation();
              onStartStatusChange(
                tierStructure.id,
                "deactivate",
                "INACTIVE",
                tierStructure.status,
              );
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-3 h-3"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 5.25v13.5m-7.5-13.5v13.5"
              />
            </svg>
          </button>
        {:else if tierStructure.status === "DRAFT" || tierStructure.status === "INACTIVE"}
          <button
            class="btn btn-xs btn-circle join-item btn-success tooltip tooltip-bottom"
            data-tip="Activate"
            aria-label="Activate"
            onclick={(e) => {
              e.stopPropagation();
              onStartStatusChange(
                tierStructure.id,
                "activate",
                "ACTIVE",
                tierStructure.status,
              );
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-3 h-3"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
              />
            </svg>
          </button>
        {/if}
        {#if onExpand}
          <button
            class="btn btn-xs btn-circle join-item btn-ghost tooltip tooltip-bottom"
            data-tip="Details"
            aria-label="Details"
            onclick={(e) => {
              e.stopPropagation();
              onExpand("tierStructures", tierStructure.id);
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="w-3 h-3"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
              />
            </svg>
          </button>
        {/if}
        <button
          class="btn btn-xs btn-circle join-item btn-primary tooltip tooltip-bottom"
          data-tip="Add tier"
          aria-label="Add tier"
          onclick={(e) => {
            e.stopPropagation();
            onCreateTier(tierStructure.id);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-3 h-3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Compact progress bar -->
    {#if loading}
      <div
        class="h-6 rounded-lg bg-base-300 flex items-center justify-center"
      >
        <span class="loading loading-spinner loading-xs"></span>
      </div>
    {:else if expandedTiers.length > 0}
      <div class="flex rounded-lg overflow-hidden h-9 w-full gap-px">
        {#each sortedTiers as tier, i (tier.id)}
          {@const segMin = tier.qualification_rules?.points.min_value ?? 0}
          {@const segMax = tier.qualification_rules?.points.max_value ?? visualMax}
          {@const widthPct = Math.max(((segMax - segMin) / visualMax) * 100, 8)}
          {@const isOpenEnded = !tier.qualification_rules?.points.max_value}
          {@const segColor = tier.metadata?.color ?? tierFallbackColors[i % tierFallbackColors.length]}
          {@const hasPointsExpirationOverride = tier.points_expiration?.type && tier.points_expiration.type !== 'INHERIT'}
          <div
            class="relative flex flex-col items-center justify-center text-[8px] font-semibold overflow-hidden group/seg cursor-pointer"
            style="width: {widthPct}%; background-color: {segColor};"
            title="{tier.name || tier.id}: {segMin} – {isOpenEnded ? '∞' : segMax} pts{hasPointsExpirationOverride ? ` · Points expiration: ${tier.points_expiration.type}` : ''}"
            role="button"
            tabindex="0"
            onclick={(e) => {
              e.stopPropagation();
              onSelect("tierStructures", tierStructure.id);
            }}
            onkeydown={(e) =>
              e.key === "Enter" && onSelect("tierStructures", tierStructure.id)}
          >
            {#if hasPointsExpirationOverride}
              <span
                class="absolute top-0.5 left-0.5 text-white/90 drop-shadow"
                title="Points expiration override: {tier.points_expiration.type}"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-2.5 h-2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            {/if}
            <span class="truncate px-1 text-white/90 drop-shadow leading-none"
              >{tier.name || tier.id}</span
            >
            <span
              class="text-white/70 text-[7px] leading-none mt-0.5 px-1 text-center w-full truncate"
              >{segMin}{isOpenEnded ? "+" : `–${segMax}`}</span
            >
            {#if onExpand}
              <button
                class="absolute top-0.5 right-0.5 opacity-0 group-hover/seg:opacity-100 transition-opacity btn btn-ghost btn-xs btn-circle bg-black/20 hover:bg-black/40 min-h-0 h-4 w-4"
                onclick={(e) => {
                  e.stopPropagation();
                  onExpand("tiers", tier.id);
                }}
                title="View details"
                aria-label="View details for {tier.name || tier.id}"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                  stroke="currentColor"
                  class="w-2.5 h-2.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                  />
                </svg>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-xs text-base-content/40 text-center py-2">
        No tiers configured
      </div>
    {/if}

    <!-- Usage info -->
    <div
      class="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-base-300/50 text-[10px] text-base-content/60"
    >
      {#if entityUsage.tierStructures?.[tierStructure.id] > 0}
        <span class="font-medium"
          >Used by <CountBadge count={entityUsage.tierStructures[tierStructure.id]} /></span
        >
      {:else}
        <span class="badge badge-xs badge-ghost">Not used</span>
      {/if}
    </div>
  {/if}
</div>
