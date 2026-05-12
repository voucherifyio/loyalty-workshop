<script>
  import EntityColumn from './EntityColumn.svelte';
  import RewardCostPopover from './RewardCostPopover.svelte';
  import { entityIcons } from '../config/designerConfig.js';
  import { getEarningRuleSummary } from '../utils/earningRuleSummary.js';

  const EARNING_RULE_TRIGGERS = [
    { key: 'orderPaid', name: 'Order Paid' },
    { key: 'customEvent', name: 'Custom Event' },
    { key: 'segmentEntered', name: 'Segment Entered' },
  ];

  const REWARD_TYPES = [
    { key: 'material', name: 'Material' },
    { key: 'digitalCoupons', name: 'Digital Coupons' },
    { key: 'digitalGiftCards', name: 'Digital Gift Cards' },
  ];

  const TRIGGER_ORDER_PAID = "customer.order.paid";
  const TRIGGER_CUSTOM_EVENT = "customer.custom_event";
  const TRIGGER_SEGMENT = "customer.segment.entered";

  let {
    entities,
    cardDefinitions = [],
    loading = false,
    hasMore = {},
    loadingMore = {},
    cursorCountdown = {},
    entityUsage = {},
    shakeCard = null,
    removingCard = null,
    assignmentActive = false,
    isEntityAssigned = () => false,
    toggleEntityAssignment = () => {},
    setRewardCost = () => {},
    pendingChanges = { toAssign: {}, rewardCosts: {} },
    selection = null,
    earningRuleCards = {},
    getClasses = () => '',
    getAssignedEntityIds = () => [],
    getRewardCardDefinitions = () => [],
    onCreate = () => {},
    onStatusChange = () => {},
    onSelect = () => {},
    onExpand = null,
    onLoadMore = () => {},
    onRefresh = () => {},
  } = $props();

  const cardDefinitionsById = $derived(
    Object.fromEntries(cardDefinitions.map(cd => [cd.id, cd]))
  );

  function getIncentiveCardDefId(item) {
    if (item.type === 'POINTS') return item.points?.card_definition_id ?? null;
    if (item.type === 'POINTS_PROPORTIONAL') return item.points_proportional?.card_definition_id ?? null;
    return null;
  }

  const earningRulesByTrigger = $derived({
    orderPaid: entities.earningRules.filter(r => r.trigger?.event === TRIGGER_ORDER_PAID),
    customEvent: entities.earningRules.filter(r => r.trigger?.event === TRIGGER_CUSTOM_EVENT),
    segmentEntered: entities.earningRules.filter(r => r.trigger?.event === TRIGGER_SEGMENT),
  });

  const rewardsByType = $derived({
    material: entities.rewards.filter(r => r.type === "MATERIAL"),
    digitalCoupons: entities.rewards.filter(r => r.type === "DIGITAL" && r.digital?.type === "DISCOUNT_COUPONS"),
    digitalGiftCards: entities.rewards.filter(r => r.type === "DIGITAL" && r.digital?.type === "GIFT_VOUCHERS"),
  });

  const incentivesByType = $derived({
    points: entities.incentives.filter(r => r.type === "POINTS" || r.type === "POINTS_PROPORTIONAL"),
    material: entities.incentives.filter(r => r.type === "MATERIAL"),
    digitalCoupons: entities.incentives.filter(r => r.type === "DIGITAL" && r.digital?.type === "DISCOUNT_COUPONS"),
    digitalGiftCards: entities.incentives.filter(r => r.type === "DIGITAL" && r.digital?.type === "GIFT_VOUCHERS"),
  });

  // Reward cost popover state
  // mode: 'new' (toggling assignment, close = unassign) | 'edit' (already assigned, close = dismiss)
  let rewardCostPopover = $state(null); // { rewardId, mode }

  function handleRewardToggle(entityType, rewardId) {
    const alreadyAssigned = isEntityAssigned(entityType, rewardId);
    if (!alreadyAssigned) {
      // About to assign — show cost popover in "new" mode
      toggleEntityAssignment(entityType, rewardId);
      rewardCostPopover = { rewardId, mode: 'new' };
    } else {
      // Unassigning — no popover needed
      toggleEntityAssignment(entityType, rewardId);
      rewardCostPopover = null;
    }
  }

  // Open popover to edit costs of an already-assigned reward (no assignment state change)
  function openRewardCostEditor(rewardId) {
    rewardCostPopover = { rewardId, mode: 'edit' };
  }

  // Shared earning rule column props
  const earningRuleColumnProps = $derived({
    icon: entityIcons.earningRules.icon,
    loading,
    hasMore: hasMore.earningRules,
    loadingMore: loadingMore.earningRules,
    countdown: cursorCountdown.earningRules,
    getClasses,
    usage: entityUsage.earningRules,
    shakeCard,
    removingCard,
    onExpand,
    onCreate: () => onCreate("earningRules"),
    onSelect: (id) => onSelect("earningRules", id),
    onStatusChange: (id, action, toStatus) => onStatusChange("earningRules", id, action, toStatus),
    onLoadMore: () => onLoadMore("earningRules"),
    onRefresh: () => onRefresh("earningRules"),
    assignmentMode: assignmentActive,
    isEntityAssigned,
    onToggleAssign: assignmentActive ? (entityType, id) => toggleEntityAssignment("earningRules", id) : null,
  });

  const rewardColumnProps = $derived({
    icon: entityIcons.rewards.icon,
    loading,
    hasMore: hasMore.rewards,
    loadingMore: loadingMore.rewards,
    countdown: cursorCountdown.rewards,
    getClasses,
    usage: entityUsage.rewards,
    shakeCard,
    removingCard,
    onExpand,
    onCreate: () => onCreate("rewards"),
    onSelect: (id) => onSelect("rewards", id),
    onStatusChange: (id, action, toStatus) => onStatusChange("rewards", id, action, toStatus),
    onLoadMore: () => onLoadMore("rewards"),
    onRefresh: () => onRefresh("rewards"),
    assignmentMode: assignmentActive,
    isEntityAssigned,
    onToggleAssign: assignmentActive ? (entityType, id) => handleRewardToggle("rewards", id) : null,
  });

  const incentiveColumnProps = $derived({
    icon: entityIcons.incentives.icon,
    loading,
    hasMore: hasMore.incentives,
    loadingMore: loadingMore.incentives,
    countdown: cursorCountdown.incentives,
    getClasses,
    usage: entityUsage.incentives,
    shakeCard,
    removingCard,
    onExpand,
    onCreate: () => onCreate("incentives"),
    onSelect: (id) => onSelect("incentives", id),
    onStatusChange: (id, action, toStatus) => onStatusChange("incentives", id, action, toStatus),
    onLoadMore: () => onLoadMore("incentives"),
    onRefresh: () => onRefresh("incentives"),
    assignmentMode: false,
    isEntityAssigned,
    onToggleAssign: null,
  });
</script>

<!-- Earnings panel -->
<div class="bg-base-200/50 rounded-xl p-5 space-y-4">
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Earnings</p>

  <!-- Earning Rules: 3 trigger columns at full width -->
  {#snippet earningRuleExtra(item)}
    {#if earningRuleCards[item.id]?.length}
      <span class="font-medium">Cards <span class="badge badge-xs badge-ghost">{earningRuleCards[item.id].length}</span></span>
    {/if}
    {#if getEarningRuleSummary(item).totalEffectCount === 0 && !earningRuleCards[item.id]?.length}
      <span class="text-base-content/40">Uses nothing</span>
    {/if}
  {/snippet}
  <div class="grid gap-4" style="grid-template-columns: 1fr 1fr 1fr;">
    {#each EARNING_RULE_TRIGGERS as { key, name }}
      <EntityColumn
        entityType="earningRules"
        items={earningRulesByTrigger[key]}
        {name}
        {...earningRuleColumnProps}
        extraBadges={earningRuleExtra}
      />
    {/each}
  </div>

  <!-- Divider + Incentives (label matches Earnings / Rewards) -->
  <div class="divider mt-4 mb-1"></div>
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Incentives</p>
  <div class="grid gap-4" style="grid-template-columns: 1fr 1fr 1fr 1fr;">
        <!-- Points -->
        <EntityColumn
          entityType="incentives"
          items={incentivesByType.points}
          name="Points"
          {...incentiveColumnProps}
        >
          {#snippet extraBadges(item)}
            {#if getIncentiveCardDefId(item)}
              {@const cdId = getIncentiveCardDefId(item)}
              <span class="font-medium text-base-content/60" title={cdId}>
                Card: <span class="badge badge-xs badge-ghost font-mono">{cardDefinitionsById[cdId]?.name || cdId}</span>
              </span>
            {/if}
          {/snippet}
        </EntityColumn>

        <!-- Material -->
        <EntityColumn
          entityType="incentives"
          items={incentivesByType.material}
          name="Material"
          {...incentiveColumnProps}
        />

        <!-- Digital Coupons -->
        <EntityColumn
          entityType="incentives"
          items={incentivesByType.digitalCoupons}
          name="Digital Coupons"
          {...incentiveColumnProps}
        />

        <!-- Digital Gift Cards -->
        <EntityColumn
          entityType="incentives"
          items={incentivesByType.digitalGiftCards}
          name="Digital Gift Cards"
          {...incentiveColumnProps}
        />
  </div>
</div>

<!-- Rewards panel -->
<div class="bg-base-200/50 rounded-xl p-5 space-y-4">
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Rewards</p>

  {#snippet rewardExtra(item)}
    {@const cost = pendingChanges.rewardCosts?.[item.id]}
    {@const assigned = isEntityAssigned("rewards", item.id)}
    {#if assignmentActive && assigned && cost}
      <span class="inline-flex items-center gap-1 text-primary/70 font-medium">
        {cost.points} pts
        {#if cost.stock > 0}<span class="text-base-content/40">· {cost.stock} stock</span>{/if}
        <button
          class="btn btn-ghost btn-xs btn-circle min-h-0 h-4 w-4 ml-0.5"
          onclick={(e) => { e.stopPropagation(); openRewardCostEditor(item.id); }}
          title="Edit assignment cost"
          aria-label="Edit reward cost"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-2.5 h-2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
        </button>
      </span>
    {:else if assignmentActive && assigned}
      <button
        class="btn btn-ghost btn-xs gap-1 min-h-0 h-5 text-warning/80 font-medium"
        onclick={(e) => { e.stopPropagation(); openRewardCostEditor(item.id); }}
        title="Set assignment cost"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        Set cost
      </button>
    {/if}
  {/snippet}

  <div class="grid gap-4" style="grid-template-columns: 1fr 1fr 1fr;">
    {#each REWARD_TYPES as { key, name }}
      <EntityColumn
        entityType="rewards"
        items={rewardsByType[key]}
        {name}
        {...rewardColumnProps}
        extraBadges={rewardExtra}
      />
    {/each}
  </div>
</div>

<!-- Reward Cost Popover -->
{#if rewardCostPopover && assignmentActive}
  <RewardCostPopover
    rewardId={rewardCostPopover.rewardId}
    cardDefinitions={getRewardCardDefinitions()}
    existingCost={pendingChanges.rewardCosts?.[rewardCostPopover.rewardId]}
    onConfirm={(costData) => {
      setRewardCost(rewardCostPopover.rewardId, costData);
      rewardCostPopover = null;
    }}
    onClose={() => {
      if (rewardCostPopover?.mode === 'new') {
        // New assignment cancelled — undo the assignment toggle
        toggleEntityAssignment("rewards", rewardCostPopover.rewardId);
      }
      // In 'edit' mode, just dismiss without changing assignment state
      rewardCostPopover = null;
    }}
  />
{/if}
