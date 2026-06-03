<script>
  import ActionToolbar from "./ActionToolbar.svelte";
  import ConfirmationOverlay from "./ConfirmationOverlay.svelte";
  import CopyId from "./CopyId.svelte";
  import FeatureIcons from "./FeatureIcons.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import OrphanTierStructures from "./OrphanTierStructures.svelte";
  import CountBadge from "./shared/CountBadge.svelte";
  import TierStructureRow from "./wallets/TierStructureRow.svelte";

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
                    >Used by <CountBadge count={entityUsage.cardDefinitions[item.id]} /></span
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
                      {@const tsAssigned = isEntityAssigned("tierStructures", tierStructure.id)}
                      <div
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
                      >
                        <TierStructureRow
                          {tierStructure}
                          expandedTiers={expandedTierStructures[tierStructure.id] || []}
                          loading={expandedTierStructures[tierStructure.id] === undefined}
                          {assignmentActive}
                          isAssigned={tsAssigned}
                          hovered={hoveredWallets.has(tierStructure.id)}
                          {entityUsage}
                          {shakeCard}
                          {removingCard}
                          confirmingStatusChange={confirmingStatusChange[tierStructure.id]}
                          changingStatus={changingStatus[tierStructure.id] || false}
                          {getClasses}
                          {onSelect}
                          {onExpand}
                          onCreateTier={onCreateTier}
                          onEditTier={onEditTier}
                          onDeleteTier={onDeleteTier}
                          onToggleAssignment={() =>
                            toggleTierStructureAssignment(tierStructure.id)}
                          onStartStatusChange={(id, action, toStatus, fromStatus) =>
                            startStatusChange(id, action, toStatus, fromStatus)}
                          onConfirmStatusChange={() =>
                            confirmStatusChange("tierStructures", tierStructure.id)}
                          onCancelStatusChange={() =>
                            cancelStatusChange(tierStructure.id)}
                        />
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
