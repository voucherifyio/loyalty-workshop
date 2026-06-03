<script>
  import { toast } from "../services/toast.js";
  import { getEarningRuleSummary } from "../utils/earningRuleSummary.js";
  import ActionToolbar from "./ActionToolbar.svelte";
  import ConfirmationOverlay from "./ConfirmationOverlay.svelte";
  import CopyId from "./CopyId.svelte";
  import FeatureIcons from "./FeatureIcons.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import CountBadge from "./shared/CountBadge.svelte";

  let {
    entityType = "",
    item = {},
    cssClasses = "",
    usage = 0,
    isShaking = false,
    isRemoving = false,
    extraBadges,
    bodyContent,
    onSelect = () => {},
    onStatusChange = () => {},
    onExpand = null,
    // Assignment mode
    assignmentMode = false,
    isAssigned = false,
    onToggleAssign = null,
  } = $props();

  let hovered = $state(false);
  let confirmingStatusChange = $state(null);
  let changingStatus = $state(false);

  async function handleStatusChange() {
    if (!confirmingStatusChange) return;

    changingStatus = true;
    try {
      await onStatusChange(
        item.id,
        confirmingStatusChange.action,
        confirmingStatusChange.toStatus,
      );
      confirmingStatusChange = null;
    } catch {
      toast.error('Failed to change status');
    } finally {
      changingStatus = false;
    }
  }

  function startStatusChange(action, toStatus) {
    confirmingStatusChange = { action, toStatus, fromStatus: item.status };
  }

  function cancelConfirmations() {
    confirmingStatusChange = null;
  }

  const earningRuleSummary = $derived(
    entityType === "earningRules" ? getEarningRuleSummary(item) : null,
  );
</script>

<div
  role="article"
  class="card card-compact shadow-sm transition-all relative group {cssClasses} {isShaking
    ? 'animate-shake'
    : ''} {isRemoving ? 'animate-fadeout' : ''} {assignmentMode && isAssigned
    ? 'bg-primary/10 border border-primary/30'
    : 'bg-base-100'}"
  onmouseenter={() => {
    if (!confirmingStatusChange) hovered = true;
  }}
  onmouseleave={() => {
    if (!confirmingStatusChange) hovered = false;
  }}
>
  {#if assignmentMode && onToggleAssign}
    <label
      class="absolute top-2 left-2 z-10 cursor-pointer"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
      aria-label={isAssigned ? "Unassign" : "Assign"}
    >
      <input
        type="checkbox"
        class="checkbox checkbox-primary checkbox-xs"
        checked={isAssigned}
        onchange={() => onToggleAssign(item.id)}
      />
    </label>
  {/if}
  {#if confirmingStatusChange}
    <ConfirmationOverlay
      message="Change status from {confirmingStatusChange.fromStatus} to {confirmingStatusChange.toStatus}?"
      confirmLabel={changingStatus ? "Changing..." : "Confirm"}
      variant="primary"
      loading={changingStatus}
      onConfirm={handleStatusChange}
      onCancel={cancelConfirmations}
    />
  {:else}
    <div
      role="button"
      tabindex="0"
      class="card-body p-3 cursor-pointer {assignmentMode ? 'pl-8' : ''}"
      onclick={() => onSelect(item.id)}
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(item.id); } }}
    >
      <ActionToolbar
        {entityType}
        status={item.status}
        {hovered}
        onStatusChange={startStatusChange}
        {onExpand}
      />

      <p class="text-xs font-medium">{item.name || item.id}</p>
      <div class="flex items-center gap-1.5 mb-0.5">
        {#if item.status}<StatusBadge status={item.status} />{/if}
        <CopyId id={item.id} />
      </div>

      {#if entityType === "earningRules" && earningRuleSummary}
        <div
          class="mt-1.5 flex flex-wrap items-center justify-center gap-1 text-[10px] leading-tight"
        >
          {#if earningRuleSummary.totalBlocks > 0}
            <span
              class="badge badge-xs badge-outline font-mono font-semibold text-base-content/70"
              title="Earning block order: first in the array is priority 1, second is 2, …"
            >
              {earningRuleSummary.totalBlocks === 1
                ? "P 1"
                : `P 1–${earningRuleSummary.totalBlocks}`}
            </span>
          {/if}
          {#if earningRuleSummary.totalEffectCount === 0}
            <span class="badge badge-xs badge-ghost text-base-content/50"
              >No effects</span
            >
          {:else if earningRuleSummary.totalBlocks > 1}
            {#each earningRuleSummary.blocks as block (block.priority)}
              <span
                class="badge badge-xs badge-ghost max-w-[11rem] truncate text-left font-medium"
                title={block.conditional
                  ? `Priority ${block.priority}: qualification rules apply`
                  : `Priority ${block.priority}: no qualification rules`}
              >
                #{block.priority}
                {#if block.effectsShort}
                  <span class="text-base-content/80 font-normal">
                    · {block.effectsShort}</span
                  >
                {/if}
                {#if block.conditional}
                  <span class="text-warning"> · if</span>
                {/if}
              </span>
            {/each}
          {:else}
            {#each earningRuleSummary.effectRows as row (row.type)}
              <span
                class="badge badge-xs badge-ghost font-medium"
                title={`${row.label} effects`}>{row.label} ×{row.count}</span
              >
            {/each}
          {/if}
          {#if earningRuleSummary.totalBlocks > 0 && earningRuleSummary.conditionalLabel && earningRuleSummary.totalBlocks <= 1}
            <span
              class="badge badge-xs font-medium {earningRuleSummary.conditionalBlockCount ===
              0
                ? 'bg-success/15 text-success border-0'
                : earningRuleSummary.conditionalBlockCount ===
                    earningRuleSummary.totalBlocks
                  ? 'bg-warning/15 text-warning border-0'
                  : 'bg-info/15 text-info border-0'}"
              title="Earning blocks with qualification rules"
            >
              {earningRuleSummary.conditionalLabel}
            </span>
          {/if}
        </div>
      {/if}

      {#if entityType === "earningRules" || item.start_date || item.end_date}
        {@const now = Date.now()}
        {@const start = item.start_date
          ? new Date(item.start_date).getTime()
          : null}
        {@const end = item.end_date ? new Date(item.end_date).getTime() : null}
        {@const progress =
          start && end
            ? Math.min(Math.max((now - start) / (end - start), 0), 1)
            : null}
        {@const fmt = (d) =>
          new Date(d).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        <div class="mt-2 px-0.5">
          <div class="relative h-1 bg-base-300 rounded-full w-full my-1">
            {#if progress !== null}
              <div
                class="absolute left-0 top-0 h-full bg-primary/50 rounded-full"
                style="width: {progress * 100}%"
              ></div>
              <div
                class="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary border-2 border-base-100"
                style="left: calc({progress * 100}% - 4px)"
              ></div>
            {/if}
            <div
              class="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full {start
                ? 'bg-base-content/40'
                : 'bg-base-300'}"
            ></div>
            <div
              class="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full {end
                ? 'bg-base-content/40'
                : 'bg-base-300'}"
            ></div>
          </div>
          <div
            class="flex items-center justify-between text-[9px] font-mono text-base-content/40"
          >
            <span>{start ? fmt(start) : "–"}</span>
            <span>{end ? fmt(end) : "∞"}</span>
          </div>
        </div>
      {/if}

      <FeatureIcons {entityType} {item} />

      {#if bodyContent}
        {@render bodyContent(item)}
      {/if}

      <div
        class="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-base-200 text-xs text-base-content/60 flex-wrap"
      >
        {#if usage}
          <span class="font-medium"
            >Used by <CountBadge count={usage} /></span
          >
          >
        {:else}
          <span class="badge badge-xs badge-ghost">Not used</span>
        {/if}
        {#if extraBadges}
          <span class="text-base-content/30">|</span>
          {@render extraBadges(item)}
        {/if}
      </div>
    </div>
  {/if}
</div>
