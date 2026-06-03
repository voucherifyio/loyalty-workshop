<script>
  import EntityColumn from './EntityColumn.svelte';
  import RewardStockEditor from './RewardStockEditor.svelte';
  import { entityIcons } from '../config/designerConfig.js';
  import { getEarningRuleSummary } from '../utils/earningRuleSummary.js';
  import CountBadge from './shared/CountBadge.svelte';

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
    setRewardStock = () => {},
    pendingChanges = { toAssign: {}, rewardStock: {} },
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

  // Reward stock editor state
  // mode: 'new' (toggling assignment, close = unassign) | 'edit' (already assigned, close = dismiss)
  let rewardStockEditor = $state(null); // { rewardId, mode }

  function handleRewardToggle(entityType, rewardId) {
    const alreadyAssigned = isEntityAssigned(entityType, rewardId);
    if (!alreadyAssigned) {
      // About to assign — show stock editor in "new" mode
      toggleEntityAssignment(entityType, rewardId);
      rewardStockEditor = { rewardId, mode: 'new' };
    } else {
      // Unassigning — no editor needed
      toggleEntityAssignment(entityType, rewardId);
      rewardStockEditor = null;
    }
  }

  // Open editor to edit stock of an already-assigned reward (no assignment state change)
  function openRewardStockEditor(rewardId) {
    rewardStockEditor = { rewardId, mode: 'edit' };
  }

  // Get column props for a specific earning rule trigger
  function getEarningRuleColumnProps(triggerEvent) {
    // Build prefill data based on trigger type
    let prefillData = { trigger: { event: triggerEvent } };
    
    // Set appropriate name based on trigger type
    if (triggerEvent === TRIGGER_ORDER_PAID) {
      prefillData.name = "Order Paid Points";
    } else if (triggerEvent === TRIGGER_CUSTOM_EVENT) {
      prefillData.name = "Custom Event Points";
      prefillData.trigger.custom_event = { schema_id: "" };
    } else if (triggerEvent === TRIGGER_SEGMENT) {
      prefillData.name = "Segment Entered Points";
      prefillData.trigger.segment = { id: "" };
    }
    
    return {
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
      onCreate: () => onCreate("earningRules", prefillData),
      onSelect: (id) => onSelect("earningRules", id),
      onStatusChange: (id, action, toStatus) => onStatusChange("earningRules", id, action, toStatus),
      onLoadMore: () => onLoadMore("earningRules"),
      onRefresh: () => onRefresh("earningRules"),
      assignmentMode: assignmentActive,
      isEntityAssigned,
      onToggleAssign: assignmentActive ? (entityType, id) => toggleEntityAssignment("earningRules", id) : null,
    };
  }

  // Get column props for a specific reward type
  function getRewardColumnProps(rewardType) {
    let prefillData = {};
    
    if (rewardType === 'material') {
      prefillData.name = "Material Reward";
      prefillData.type = "MATERIAL";
      prefillData.material = {
        type: "PRODUCT",
        product: { id: "" }
      };
      prefillData.digital = ""; // Exclude digital field for material rewards
    } else if (rewardType === 'digitalCoupons') {
      prefillData.name = "Discount Coupon Reward";
      prefillData.type = "DIGITAL";
      prefillData.digital = {
        type: "DISCOUNT_COUPONS",
        discount_coupons: { campaign_id: "" }
      };
      prefillData.material = ""; // Exclude material field for digital rewards
    } else if (rewardType === 'digitalGiftCards') {
      prefillData.name = "Gift Voucher Reward";
      prefillData.type = "DIGITAL";
      prefillData.digital = {
        type: "GIFT_VOUCHERS",
        gift_vouchers: { 
          campaign_id: "",
          balance: 0
        }
      };
      prefillData.material = ""; // Exclude material field for digital rewards
    }
    
    return {
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
      onCreate: () => onCreate("rewards", prefillData),
      onSelect: (id) => onSelect("rewards", id),
      onStatusChange: (id, action, toStatus) => onStatusChange("rewards", id, action, toStatus),
      onLoadMore: () => onLoadMore("rewards"),
      onRefresh: () => onRefresh("rewards"),
      assignmentMode: assignmentActive,
      isEntityAssigned,
      onToggleAssign: assignmentActive ? (entityType, id) => handleRewardToggle("rewards", id) : null,
    };
  }

  // Get column props for a specific incentive type
  function getIncentiveColumnProps(incentiveType) {
    let prefillData = {};
    
    if (incentiveType === 'points') {
      prefillData.name = "Points Incentive";
      prefillData.type = "POINTS";
      prefillData.points = { value: 0, card_definition_id: "" };
      prefillData.material = ""; // Exclude material field
      prefillData.digital = ""; // Exclude digital field
    } else if (incentiveType === 'material') {
      prefillData.name = "Material Incentive";
      prefillData.type = "MATERIAL";
      prefillData.material = {
        type: "PRODUCT",
        product: { id: "" }
      };
      prefillData.points = ""; // Exclude points field
      prefillData.digital = ""; // Exclude digital field
    } else if (incentiveType === 'digitalCoupons') {
      prefillData.name = "Discount Coupon Incentive";
      prefillData.type = "DIGITAL";
      prefillData.digital = {
        type: "DISCOUNT_COUPONS",
        discount_coupons: { campaign_id: "" }
      };
      prefillData.points = ""; // Exclude points field
      prefillData.material = ""; // Exclude material field
    } else if (incentiveType === 'digitalGiftCards') {
      prefillData.name = "Gift Voucher Incentive";
      prefillData.type = "DIGITAL";
      prefillData.digital = {
        type: "GIFT_VOUCHERS",
        gift_vouchers: { 
          campaign_id: "",
          balance: 0
        }
      };
      prefillData.points = ""; // Exclude points field
      prefillData.material = ""; // Exclude material field
    }
    
    return {
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
      onCreate: () => onCreate("incentives", prefillData),
      onSelect: (id) => onSelect("incentives", id),
      onStatusChange: (id, action, toStatus) => onStatusChange("incentives", id, action, toStatus),
      onLoadMore: () => onLoadMore("incentives"),
      onRefresh: () => onRefresh("incentives"),
      assignmentMode: false,
      isEntityAssigned,
      onToggleAssign: null,
    };
  }
</script>

<!-- Earnings panel -->
<div class="bg-base-200/50 rounded-xl p-5 space-y-4">
  <div class="flex items-center gap-2">
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Earnings</p>
    {#if assignmentActive}
      <span class="badge badge-xs badge-ghost text-base-content/50">Toggle to assign</span>
    {/if}
  </div>

  <!-- Earning Rules: 3 trigger columns at full width -->
  {#snippet earningRuleBody(item)}
    {@const earnings = item.earnings}
    {#if earnings?.length}
      {@const allEffects = earnings.flatMap(block => block.effects || [])}
      {@const blocksWithTierRules = earnings.filter(block => block.tier_rules?.type === 'ANY_OF' && block.tier_rules.any_of?.length > 0)}
      <div class="mt-2 pt-2 border-t border-base-200">
        <div class="flex items-start gap-2 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-base-content/50 shrink-0 mt-0.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
          </svg>
          <div class="flex-1 space-y-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-base-content/70">Earnings:</span>
              <span class="badge badge-sm badge-ghost">
                {allEffects.length} effect{allEffects.length !== 1 ? 's' : ''}
              </span>
            </div>
            {#if allEffects.length > 0}
              <div class="space-y-1">
                {#each allEffects.slice(0, 3) as effect}
                  <div class="flex items-center gap-1.5 flex-wrap text-[10px]">
                    {#if effect.type === 'POINTS' && effect.points}
                      <span class="badge badge-xs badge-primary">
                        {effect.points.value} pts
                      </span>
                      {#if effect.points.card_definition_id}
                        <span class="text-base-content/50">→</span>
                        <span class="badge badge-xs badge-outline font-mono">
                          {cardDefinitionsById[effect.points.card_definition_id]?.name || 'Unknown'}
                        </span>
                      {/if}
                    {:else if effect.type === 'INCENTIVE' && effect.incentive}
                      <span class="badge badge-xs badge-secondary">Incentive</span>
                      {#if effect.incentive.id}
                        {@const incentive = entities.incentives.find(i => i.id === effect.incentive.id)}
                        {#if incentive}
                          <span class="text-base-content/50">→</span>
                          <span class="badge badge-xs badge-outline font-mono truncate max-w-[100px]" title={incentive.name}>
                            {incentive.name || incentive.id}
                          </span>
                        {/if}
                      {/if}
                    {:else if effect.type === 'POINTS_PROPORTIONAL'}
                      <span class="badge badge-xs badge-accent">Points Proportional</span>
                    {/if}
                  </div>
                {/each}
                {#if allEffects.length > 3}
                  <div class="text-[10px] text-base-content/50 italic">
                    +{allEffects.length - 3} more effect{allEffects.length - 3 !== 1 ? 's' : ''}
                  </div>
                {/if}
              </div>
            {/if}
            {#if blocksWithTierRules.length > 0}
              <div class="flex items-center gap-1.5 text-[10px] text-base-content/60 pt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span>Tier rules: {blocksWithTierRules.length} block{blocksWithTierRules.length !== 1 ? 's' : ''}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/snippet}

  {#snippet earningRuleExtra(item)}
    {#if earningRuleCards[item.id]?.length}
      <span class="font-medium">Cards <CountBadge count={earningRuleCards[item.id].length} /></span>
    {/if}
    {#if getEarningRuleSummary(item).totalEffectCount === 0 && !earningRuleCards[item.id]?.length}
      <span class="text-base-content/40">Uses nothing</span>
    {/if}
  {/snippet}
  
  <div class="grid grid-cols-3 gap-4">
    <EntityColumn
      entityType="earningRules"
      items={earningRulesByTrigger.orderPaid}
      name="Order Paid"
      {...getEarningRuleColumnProps(TRIGGER_ORDER_PAID)}
      bodyContent={earningRuleBody}
      extraBadges={earningRuleExtra}
    />
    <EntityColumn
      entityType="earningRules"
      items={earningRulesByTrigger.customEvent}
      name="Custom Event"
      {...getEarningRuleColumnProps(TRIGGER_CUSTOM_EVENT)}
      bodyContent={earningRuleBody}
      extraBadges={earningRuleExtra}
    />
    <EntityColumn
      entityType="earningRules"
      items={earningRulesByTrigger.segmentEntered}
      name="Segment Entered"
      {...getEarningRuleColumnProps(TRIGGER_SEGMENT)}
      bodyContent={earningRuleBody}
      extraBadges={earningRuleExtra}
    />
  </div>

  <!-- Divider + Incentives (label matches Earnings / Rewards) -->
  <div class="divider mt-4 mb-1"></div>
  <div class="flex items-center gap-2">
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Incentives</p>
    {#if assignmentActive}
      <span class="badge badge-xs badge-ghost text-base-content/50">View only</span>
    {/if}
  </div>
  <div class="grid grid-cols-4 gap-4">
        <!-- Points -->
        <EntityColumn
          entityType="incentives"
          items={incentivesByType.points}
          name="Points"
          {...getIncentiveColumnProps('points')}
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
          {...getIncentiveColumnProps('material')}
        />

        <!-- Digital Coupons -->
        <EntityColumn
          entityType="incentives"
          items={incentivesByType.digitalCoupons}
          name="Digital Coupons"
          {...getIncentiveColumnProps('digitalCoupons')}
        />

        <!-- Digital Gift Cards -->
        <EntityColumn
          entityType="incentives"
          items={incentivesByType.digitalGiftCards}
          name="Digital Gift Cards"
          {...getIncentiveColumnProps('digitalGiftCards')}
        />
  </div>
</div>

<!-- Rewards panel -->
<div class="bg-base-200/50 rounded-xl p-5 space-y-4">
  <div class="flex items-center gap-2">
    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Rewards</p>
    {#if assignmentActive}
      <span class="badge badge-xs badge-ghost text-base-content/50">Toggle to assign</span>
    {/if}
  </div>

  {#snippet rewardBody(item)}
    {@const costs = item.costs}
    {@const firstCost = costs?.[0]}
    {@const firstSpending = firstCost?.spending?.[0]}
    {@const costsWithTierRules = costs?.filter(cost => cost.tier_rules?.type === 'ANY_OF' && cost.tier_rules.any_of?.length > 0) || []}
    
    {#if !assignmentActive && costs?.length && firstSpending}
      <!-- Costs section - only show when not in assignment mode -->
      <div class="mt-2 pt-2 border-t border-base-200">
        <div class="flex items-start gap-2 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-base-content/50 shrink-0 mt-0.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
          </svg>
          <div class="flex-1 space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-base-content/70">Cost:</span>
              <span class="badge badge-sm badge-ghost font-mono">{firstSpending.points} pts</span>
              <span class="text-base-content/50">from</span>
              <span class="badge badge-sm badge-outline font-mono text-[10px]">
                {cardDefinitionsById[firstSpending.card_definition_id]?.name || 'Unknown Wallet'}
              </span>
            </div>
            {#if costs.length > 1}
              <div class="text-[10px] text-base-content/50">
                +{costs.length - 1} more cost configuration{costs.length > 2 ? 's' : ''}
              </div>
            {/if}
            {#if costsWithTierRules.length > 0}
              <div class="flex items-center gap-1.5 text-[10px] text-base-content/60 pt-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span>Tier rules: {costsWithTierRules.length} cost{costsWithTierRules.length !== 1 ? 's' : ''}</span>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/snippet}

  {#snippet rewardExtra(item)}
    {@const stock = pendingChanges.rewardStock?.[item.id]}
    {@const assigned = isEntityAssigned("rewards", item.id)}
    
    {#if assignmentActive && assigned && stock}
      <span class="inline-flex items-center gap-1 text-primary/70 font-medium">
        {#if stock.type === 'UNLIMITED'}
          <span class="text-base-content/60">∞ Unlimited</span>
        {:else if stock.type === 'LIMITED'}
          <span>Limited: {stock.limited?.quantity || 0}</span>
        {/if}
        <button
          class="btn btn-ghost btn-xs btn-circle min-h-0 h-4 w-4 ml-0.5"
          onclick={(e) => { e.stopPropagation(); openRewardStockEditor(item.id); }}
          title="Edit stock"
          aria-label="Edit reward stock"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-2.5 h-2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
        </button>
      </span>
    {:else if assignmentActive && assigned}
      <button
        class="btn btn-ghost btn-xs gap-1 min-h-0 h-5 text-warning/80 font-medium"
        onclick={(e) => { e.stopPropagation(); openRewardStockEditor(item.id); }}
        title="Set stock"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        Set stock
      </button>
    {/if}
  {/snippet}

  <div class="grid gap-4" style="grid-template-columns: 1fr 1fr 1fr;">
    <EntityColumn
      entityType="rewards"
      items={rewardsByType.material}
      name="Material"
      {...getRewardColumnProps('material')}
      bodyContent={rewardBody}
      extraBadges={rewardExtra}
    />
    <EntityColumn
      entityType="rewards"
      items={rewardsByType.digitalCoupons}
      name="Digital Coupons"
      {...getRewardColumnProps('digitalCoupons')}
      bodyContent={rewardBody}
      extraBadges={rewardExtra}
    />
    <EntityColumn
      entityType="rewards"
      items={rewardsByType.digitalGiftCards}
      name="Digital Gift Cards"
      {...getRewardColumnProps('digitalGiftCards')}
      bodyContent={rewardBody}
      extraBadges={rewardExtra}
    />
  </div>
</div>

<!-- Reward Stock Editor -->
{#if rewardStockEditor && assignmentActive}
  <RewardStockEditor
    rewardId={rewardStockEditor.rewardId}
    existingStock={pendingChanges.rewardStock?.[rewardStockEditor.rewardId]}
    onConfirm={(stockData) => {
      setRewardStock(rewardStockEditor.rewardId, stockData);
      rewardStockEditor = null;
    }}
    onClose={() => {
      if (rewardStockEditor?.mode === 'new') {
        // New assignment cancelled — undo the assignment toggle
        toggleEntityAssignment("rewards", rewardStockEditor.rewardId);
      }
      // In 'edit' mode, just dismiss without changing assignment state
      rewardStockEditor = null;
    }}
  />
{/if}
