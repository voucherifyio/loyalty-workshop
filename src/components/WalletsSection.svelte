<script>
  import ActionToolbar from "./ActionToolbar.svelte";
  import ConfirmationOverlay from "./ConfirmationOverlay.svelte";
  import CopyId from "./CopyId.svelte";
  import FeatureIcons from "./FeatureIcons.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import OrphanTierStructures from "./OrphanTierStructures.svelte";

  let {
    cardDefinitions = [],
    tierStructures = [],
    tiersByCardDef = () => ({}),
    orphanTierStructures = () => [],
    expandedTierStructures = {},
    loading = false,
    hasMore = {},
    entityUsage = {},
    shakeCard = null,
    removingCard = null,
    // New assignment props
    assignmentActive = false,
    isEntityAssigned = () => false,
    toggleTierStructureAssignment = () => {},
    toggleEntityAssignment = () => {},
    /** When set, used for card-definition checkbox (tier-structure picker flow). Otherwise falls back to toggleEntityAssignment. */
    onToggleCardDefinitionAssignment = null,
    selection = null,
    getClasses = () => "",
    onCreate = () => {},
    onCreateTierForCardDef = () => {},
    onCreateTier = () => {},
    onEdit = () => {},
    onEditTier = () => {},
    onDelete = () => {},
    onDeleteTier = () => {},
    onStatusChange = () => {},
    onSelect = () => {},
    onExpand = null,
    onToggleTierExpand = () => {},
  } = $props();

  let hoveredWallets = $state(new Set());

  // Keyed by item ID — stores { action, toStatus, fromStatus } when awaiting confirmation
  let confirmingStatusChange = $state({});
  let changingStatus = $state({});

  function startStatusChange(id, action, toStatus, fromStatus) {
    confirmingStatusChange = {
      ...confirmingStatusChange,
      [id]: { action, toStatus, fromStatus },
    };
  }

  function cancelStatusChange(id) {
    const { [id]: _, ...rest } = confirmingStatusChange;
    confirmingStatusChange = rest;
    const { [id]: __, ...rest2 } = changingStatus;
    changingStatus = rest2;
  }

  async function confirmStatusChange(entityType, id) {
    const pending = confirmingStatusChange[id];
    if (!pending) return;
    changingStatus = { ...changingStatus, [id]: true };
    try {
      await onStatusChange(entityType, id, pending.action, pending.toStatus);
      cancelStatusChange(id);
    } catch (err) {
      changingStatus = { ...changingStatus, [id]: false };
    }
  }
</script>

<!-- Section 1: Wallets -->
<div>
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  {:else if cardDefinitions.length === 0}
    <p
      class="text-sm text-base-content/50 text-center py-8 bg-base-200 rounded-lg"
    >
      No card definitions found
    </p>
  {:else}
    <div class="flex gap-4 overflow-x-auto p-2">
      {#each cardDefinitions as item}
        {@const cardAssigned = isEntityAssigned("cardDefinitions", item.id)}
        {@const cdClasses = getClasses('cardDefinitions', item)}
        <div
          role="group"
          class="{cdClasses.includes('bg-primary') ? '' : 'bg-base-100'} shadow-sm rounded-lg p-4 transition-all relative {cdClasses} {shakeCard?.type === 'cardDefinitions' && shakeCard?.id === item.id
            ? 'animate-shake'
            : ''} {removingCard?.type === 'cardDefinitions' &&
          removingCard?.id === item.id
            ? 'animate-fadeout'
            : ''}           min-w-96 shrink-0 {assignmentActive && cardAssigned && !cdClasses.includes('bg-primary')
            ? 'ring-2 ring-primary/40'
            : ''}"
          onmouseenter={() => {
            hoveredWallets = new Set(hoveredWallets).add(item.id);
          }}
          onmouseleave={() => {
            const newSet = new Set(hoveredWallets);
            newSet.delete(item.id);
            hoveredWallets = newSet;
          }}
        >
          <!-- Assignment checkbox for card definitions -->
          {#if assignmentActive}
            <label
              class="absolute top-2 left-2 z-10 cursor-pointer"
              onclick={(e) => e.stopPropagation()}
              aria-label={cardAssigned
                ? "Unassign card definition"
                : "Assign card definition"}
            >
              <input
                type="checkbox"
                class="checkbox checkbox-primary checkbox-xs"
                checked={cardAssigned}
                onchange={() => {
                  if (onToggleCardDefinitionAssignment) {
                    onToggleCardDefinitionAssignment(item.id);
                  } else {
                    toggleEntityAssignment("cardDefinitions", item.id);
                  }
                }}
              />
            </label>
          {/if}

          {#if confirmingStatusChange[item.id]}
            <ConfirmationOverlay
              message="Change status from {confirmingStatusChange[item.id]
                .fromStatus} to {confirmingStatusChange[item.id].toStatus}?"
              confirmLabel={changingStatus[item.id] ? "Changing..." : "Confirm"}
              variant="primary"
              loading={changingStatus[item.id] || false}
              onConfirm={() => confirmStatusChange("cardDefinitions", item.id)}
              onCancel={() => cancelStatusChange(item.id)}
            />
          {:else}
            <!-- Action Toolbar -->
            <ActionToolbar
              entityType="cardDefinitions"
              status={item.status}
              hovered={hoveredWallets.has(item.id)}
              onStatusChange={(action, toStatus) =>
                startStatusChange(item.id, action, toStatus, item.status)}
              onExpand={onExpand
                ? () => onExpand("cardDefinitions", item.id)
                : null}
            />

            <!-- Card Definition Header -->
            <div
              role="button"
              tabindex="0"
              class="cursor-pointer mb-4 {assignmentActive ? 'pl-5' : ''}"
              onclick={() => onSelect("cardDefinitions", item.id)}
              onkeydown={(e) =>
                e.key === "Enter" && onSelect("cardDefinitions", item.id)}
            >
              <div class="mb-1">
                <h3 class="text-base font-bold">
                  {item.name || item.id}
                </h3>
              </div>
              <div class="flex items-center gap-1.5 mb-2">
                {#if item.status}<StatusBadge status={item.status} />{/if}
                <CopyId id={item.id} />
              </div>
              <FeatureIcons entityType="cardDefinitions" {item} />
              <div
                class="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-base-200 text-xs text-base-content/60"
              >
                {#if entityUsage.cardDefinitions?.[item.id] > 0}
                  <span class="font-medium"
                    >Used by <span class="badge badge-xs badge-ghost"
                      >{entityUsage.cardDefinitions[item.id]}</span
                    ></span
                  >
                {:else}
                  <span class="badge badge-xs badge-ghost">Not used</span>
                {/if}
              </div>
            </div>

            <!-- Divider -->
            <div class="divider my-2"></div>

            <!-- Tier Structures (compact) -->
            {#each [tiersByCardDef()[item.id] || []] as cardTierStructures}
              <div class="pt-2">
                <div class="flex items-center justify-between mb-2">
                  <span
                    class="text-xs font-semibold text-base-content/60 uppercase tracking-wide"
                  >
                    {cardTierStructures.length === 0
                      ? "Tier Structures"
                      : `Tier Structures (${cardTierStructures.length})`}
                  </span>
                  <button
                    class="btn btn-circle btn-xs btn-primary"
                    onclick={() => onCreateTierForCardDef(item.id)}
                    aria-label="Create tier structure"
                    title="Create tier structure"
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

                {#if cardTierStructures.length > 0}
                  <div class="space-y-3">
                    {#each cardTierStructures as tierStructure}
                      {@const tierAssigned = isEntityAssigned(
                        "tierStructures",
                        tierStructure.id,
                      )}
                      {@const tsHovered = hoveredWallets.has(tierStructure.id)}
                      {@const statusColor =
                        tierStructure.status === "ACTIVE"
                          ? "bg-success"
                          : tierStructure.status === "INACTIVE"
                            ? "bg-error"
                            : "bg-warning"}

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
                          : ''} {assignmentActive && tierAssigned
                          ? 'border-primary/45 bg-primary/5 ring-1 ring-primary/35'
                          : ''}"
                        onmouseenter={() => {
                          hoveredWallets = new Set(hoveredWallets).add(
                            tierStructure.id,
                          );
                        }}
                        onmouseleave={() => {
                          const s = new Set(hoveredWallets);
                          s.delete(tierStructure.id);
                          hoveredWallets = s;
                        }}
                        role="group"
                      >
                        {#if confirmingStatusChange[tierStructure.id]}
                          <ConfirmationOverlay
                            message="Change status from {confirmingStatusChange[
                              tierStructure.id
                            ].fromStatus} to {confirmingStatusChange[
                              tierStructure.id
                            ].toStatus}?"
                            confirmLabel={changingStatus[tierStructure.id]
                              ? "Changing..."
                              : "Confirm"}
                            variant="primary"
                            loading={changingStatus[tierStructure.id] || false}
                            onConfirm={() =>
                              confirmStatusChange(
                                "tierStructures",
                                tierStructure.id,
                              )}
                            onCancel={() =>
                              cancelStatusChange(tierStructure.id)}
                          />
                        {:else}
                          <!-- Compact single-line row: [radio?] [status dot] name + badge … [actions right] -->
                          <div
                            class="flex items-center gap-1.5 mb-1 w-full min-w-0"
                          >
                            {#if assignmentActive}
                              <input
                                type="radio"
                                class="radio radio-primary radio-xs shrink-0"
                                checked={tierAssigned}
                                onchange={() =>
                                  toggleTierStructureAssignment(
                                    tierStructure.id,
                                  )}
                                title="Only one tier structure can be assigned per program"
                              />
                            {/if}
                            <span
                              class="w-1.5 h-1.5 rounded-full shrink-0 {statusColor}"
                            ></span>
                            <div
                              class="flex min-w-0 flex-1 items-center gap-1.5"
                            >
                              <button
                                class="text-xs font-semibold text-left truncate hover:text-primary transition-colors cursor-pointer min-w-0"
                                onclick={() =>
                                  onSelect("tierStructures", tierStructure.id)}
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
                            <!-- Action buttons (same join group as ActionToolbar / entity cards) -->
                            <div
                              class="join join-horizontal ml-auto shrink-0 rounded-lg bg-base-100/90 transition-opacity {tsHovered
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
                                    startStatusChange(
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
                                    startStatusChange(
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
                                    onExpand(
                                      "tierStructures",
                                      tierStructure.id,
                                    );
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
                          {#if expandedTierStructures[tierStructure.id] === undefined}
                            {onToggleTierExpand(tierStructure.id)}
                            <div
                              class="h-6 rounded-lg bg-base-300 flex items-center justify-center"
                            >
                              <span class="loading loading-spinner loading-xs"
                              ></span>
                            </div>
                          {:else if expandedTierStructures[tierStructure.id].length > 0}
                            {@const tierFallbackColors = [
                              "#6b7280",
                              "#8b5cf6",
                              "#f59e0b",
                              "#10b981",
                              "#3b82f6",
                              "#ef4444",
                            ]}
                            {@const sortedTiers = [
                              ...expandedTierStructures[tierStructure.id],
                            ].sort(
                              (a, b) =>
                                (a.qualification_rules?.points.min_value ?? 0) -
                                (b.qualification_rules?.points.min_value ?? 0),
                            )}
                            {@const knownMaxValues = sortedTiers
                              .map(
                                (t) => t.qualification_rules?.points.max_value,
                              )
                              .filter((v) => v != null)}
                            {@const highestKnownMax =
                              knownMaxValues.length > 0
                                ? Math.max(...knownMaxValues)
                                : 0}
                            {@const visualMax =
                              highestKnownMax > 0
                                ? highestKnownMax * 1.35
                                : (sortedTiers.at(-1)?.qualification_rules
                                    ?.points.min_value ?? 0) * 1.35 || 1000}
                            <div
                              class="flex rounded-lg overflow-hidden h-9 w-full gap-px"
                            >
                              {#each sortedTiers as tier, i}
                                {@const segMin =
                                  tier.qualification_rules?.points.min_value ??
                                  0}
                                {@const segMax =
                                  tier.qualification_rules?.points.max_value ??
                                  visualMax}
                                {@const widthPct = Math.max(
                                  ((segMax - segMin) / visualMax) * 100,
                                  8,
                                )}
                                {@const isOpenEnded =
                                  !tier.qualification_rules?.points.max_value}
                                {@const segColor =
                                  tier.metadata?.color ??
                                  tierFallbackColors[
                                    i % tierFallbackColors.length
                                  ]}
                                <div
                                  class="relative flex flex-col items-center justify-center text-[8px] font-semibold overflow-hidden group/seg cursor-pointer"
                                  style="width: {widthPct}%; background-color: {segColor};"
                                  title="{tier.name ||
                                    tier.id}: {segMin} – {isOpenEnded
                                    ? '∞'
                                    : segMax} pts"
                                  role="button"
                                  tabindex="0"
                                  onclick={(e) => {
                                    e.stopPropagation();
                                    onSelect(
                                      "tierStructures",
                                      tierStructure.id,
                                    );
                                  }}
                                  onkeydown={(e) =>
                                    e.key === "Enter" &&
                                    onSelect(
                                      "tierStructures",
                                      tierStructure.id,
                                    )}
                                >
                                  <span
                                    class="truncate px-1 text-white/90 drop-shadow leading-none"
                                    >{tier.name || tier.id}</span
                                  >
                                  <span
                                    class="text-white/70 text-[7px] leading-none mt-0.5 px-1 text-center w-full truncate"
                                    >{segMin}{isOpenEnded
                                      ? "+"
                                      : `–${segMax}`}</span
                                  >
                                  <button
                                    class="absolute top-0.5 right-0.5 opacity-0 group-hover/seg:opacity-100 transition-opacity btn btn-ghost btn-xs btn-circle bg-black/20 hover:bg-black/40 min-h-0 h-4 w-4"
                                    onclick={(e) => {
                                      e.stopPropagation();
                                      onEditTier(tierStructure.id, tier.id);
                                    }}
                                    title="Edit {tier.name || 'tier'}"
                                    aria-label="Edit tier"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke-width="2.5"
                                      stroke="currentColor"
                                      class="w-2 h-2 text-white"
                                    >
                                      <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              {/each}
                            </div>
                          {:else}
                            <div
                              class="h-6 rounded-lg bg-base-300/60 flex items-center justify-center"
                            >
                              <span class="text-[10px] text-base-content/40"
                                >No tiers</span
                              >
                            </div>
                          {/if}
                          <FeatureIcons
                            entityType="tierStructures"
                            item={tierStructure}
                          />
                          <div
                            class="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-base-200 text-xs text-base-content/60"
                          >
                            {#if entityUsage.tierStructures?.[tierStructure.id] > 0}
                              <span class="font-medium"
                                >Used by <span
                                  class="badge badge-xs badge-ghost"
                                  >{entityUsage.tierStructures[
                                    tierStructure.id
                                  ]}</span
                                ></span
                              >
                            {:else}
                              <span class="badge badge-xs badge-ghost"
                                >Not used</span
                              >
                            {/if}
                          </div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {:else}
                  <p class="text-xs text-base-content/40 text-center py-2">
                    No tier structures
                  </p>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Orphan Tier Structures (if any exist without card_definition_id) -->
  <OrphanTierStructures
    tierStructures={orphanTierStructures()}
    {entityUsage}
    onEdit={onEdit}
    onDelete={onDelete}
  />
</div>
