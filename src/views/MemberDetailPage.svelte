<script>
  import { untrack } from "svelte";
  import { router, push } from "svelte-spa-router";
  import { toast } from "../services/toast.js";
  import { getActivityTypeColor } from "../utils/activityFormatting.js";
  import * as memberDataService from "../services/memberDataService.js";
  import * as cardActionsService from "../services/cardActionsService.js";
  import CreateOrderModal from "../components/CreateOrderModal.svelte";
  import PayWithPointsModal from "../components/PayWithPointsModal.svelte";
  import PurchaseRewardModal from "../components/PurchaseRewardModal.svelte";
  import TriggerCustomEventModal from "../components/TriggerCustomEventModal.svelte";
  import CardReports from "../components/member/CardReports.svelte";
  import AdjustPointsDialog from "../components/member/dialogs/AdjustPointsDialog.svelte";
  import RefundDialog from "../components/member/dialogs/RefundDialog.svelte";
  import MemberHeader from "../components/member/MemberHeader.svelte";
  import CardSummaryPills from "../components/member/CardSummaryPills.svelte";
  import ActivitiesTab from "../components/member/tabs/ActivitiesTab.svelte";
  import EarningsExaminationTab from "../components/member/tabs/EarningsExaminationTab.svelte";
  import SpendingExaminationTab from "../components/member/tabs/SpendingExaminationTab.svelte";
  import OverviewTab from "../components/member/tabs/OverviewTab.svelte";
  import RawJsonTab from "../components/member/tabs/RawJsonTab.svelte";
  import TimelineTab from "../components/member/tabs/TimelineTab.svelte";
  import TransactionFilterBar from "../components/member/TransactionFilterBar.svelte";

  const programId = $derived(router.params.programId);
  const memberId = $derived(router.params.memberId);

  // ── Core data ────────────────────────────────────────────────────────────────
  let membership = $state(null);
  let loadingMember = $state(false);
  let selectedCardIndex = $state(null);
  let activeTab = $state("cards");

  // ── Per-card overview data ────────────────────────────────────────────────────
  let pendingBuckets = $state([]);
  let expiringBuckets = $state([]);
  let loadingCardDetail = $state(false);
  let processingBucket = $state(null);

  // ── Transaction lists ─────────────────────────────────────────────────────────
  let memberActivities = $state([]);
  let cardActivities = $state([]);
  let cardTransactions = $state([]);
  let memberTransactions = $state([]);
  let loadingTx = $state(false);
  let loadingCardTx = $state(false);
  let loadingMemberTx = $state(false);
  let expandedRows = $state({});
  let txSourceFilter = $state(new Set(["Card", "Reward", "Order"]));
  let memberTxSourceFilter = $state(new Set(["Benefit", "Tier"]));

  // ── Modal / dialog visibility ─────────────────────────────────────────────────
  let adjustPointsOpen = $state(false);
  let adjustPointsValue = $state("");
  let adjustPointsReason = $state("");
  let adjustingPoints = $state(false);
  let purchaseRewardOpen = $state(false);
  let payWithPointsOpen = $state(false);
  let createOrderOpen = $state(false);
  let triggerEventOpen = $state(false);
  let refundDialogOpen = $state(false);
  let refundDialogTxId = $state(null);
  let refundPolicyRefund = $state("DEFAULT");
  let refundPolicyStock = $state("DEFAULT");
  let processingRefund = $state(null);
  let refreshing = $state(false);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const isMemberMode = $derived(selectedCardIndex === null);
  const selectedMemberCard = $derived(
    selectedCardIndex !== null
      ? (membership?.cards?.[selectedCardIndex] ?? null)
      : null,
  );
  const selectedCard = $derived(selectedMemberCard?.card ?? null);

  const filteredCardTransactions = $derived(
    cardTransactions.filter((tx) => txSourceFilter.has(tx._source))
  );

  const filteredMemberTransactions = $derived(
    memberTransactions.filter((tx) => memberTxSourceFilter.has(tx._source))
  );

  const TABS = [
    { id: "cards", label: "Cards" },
    { id: "earning", label: "Earning Possibilities" },
    { id: "spending", label: "Spending Possibilities" },
    { id: "activities", label: "Activities" },
    { id: "benefits", label: "Transactions" },
    { id: "json", label: "JSON" },
  ];

  const CARD_TX_FILTER_OPTIONS = [
    { value: 'Card', label: 'Card', variant: 'info' },
    { value: 'Reward', label: 'Reward', variant: 'accent' },
    { value: 'Order', label: 'Order', variant: 'warning' },
  ];

  const MEMBER_TX_FILTER_OPTIONS = [
    { value: 'Benefit', label: 'Benefit', variant: 'success' },
    { value: 'Tier', label: 'Tier', variant: 'secondary' },
  ];

  // ── Effects ───────────────────────────────────────────────────────────────────
  $effect(() => {
    if (programId && memberId) {
      fetchMember();
    }
  });

  $effect(() => {
    if (membership && selectedCardIndex !== null) {
      const card = membership.cards?.[selectedCardIndex];
      if (card?.card?.id) {
        expandedRows = {};
        fetchCardOverview(card.card.id);
        fetchCardActivities(card.card.id);
        fetchCardTransactions(card.card.id);
      }
    }
  });

  $effect(() => {
    if (!membership) return;

    if (activeTab === "activities") fetchMemberActivities();
    else if (activeTab === "benefits") fetchMemberTransactions();
  });

  // ── Data fetching ─────────────────────────────────────────────────────────────
  async function fetchMember() {
    loadingMember = true;
    try {
      membership = await memberDataService.fetchMember(programId, memberId);
    } catch {
      toast.error('Failed to fetch member');
    } finally {
      loadingMember = false;
    }
  }

  async function fetchCardOverview(cardId) {
    loadingCardDetail = true;
    pendingBuckets = [];
    expiringBuckets = [];
    clearTransactionData();
    try {
      const result = await memberDataService.fetchCardOverview(programId, memberId, cardId);
      pendingBuckets = result.pendingBuckets;
      expiringBuckets = result.expiringBuckets;
    } finally {
      loadingCardDetail = false;
    }
  }

  async function fetchMemberActivities() {
    if (untrack(() => memberActivities.length) > 0) return;
    loadingTx = true;
    try {
      memberActivities = await memberDataService.fetchMemberActivities(programId, memberId);
    } catch {
      toast.error('Failed to fetch member activities');
    } finally {
      loadingTx = false;
    }
  }

  async function fetchCardActivities(cardId) {
    if (untrack(() => cardActivities.length) > 0) return;
    loadingTx = true;
    try {
      cardActivities = await memberDataService.fetchCardActivities(programId, memberId, cardId);
    } catch {
      toast.error('Failed to fetch card activities');
    } finally {
      loadingTx = false;
    }
  }

  async function fetchCardTransactions(cardId) {
    if (untrack(() => cardTransactions.length) > 0) return;
    loadingCardTx = true;
    try {
      cardTransactions = await memberDataService.fetchCardTransactions(programId, memberId, cardId);
    } catch {
      toast.error('Failed to fetch card transactions');
    } finally {
      loadingCardTx = false;
    }
  }

  async function fetchMemberTransactions() {
    if (untrack(() => memberTransactions.length) > 0) return;
    loadingMemberTx = true;
    try {
      memberTransactions = await memberDataService.fetchMemberTransactions(programId, memberId);
    } catch {
      toast.error('Failed to fetch member transactions');
    } finally {
      loadingMemberTx = false;
    }
  }

  function clearTransactionData() {
    memberActivities = [];
    cardActivities = [];
    cardTransactions = [];
    memberTransactions = [];
    expandedRows = {};
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  async function refreshAfterAction() {
    const cardId = membership?.cards?.[selectedCardIndex]?.card?.id;
    await fetchMember();
    if (cardId) await fetchCardOverview(cardId);
  }

  async function refreshAll() {
    refreshing = true;
    try {
      clearTransactionData();
      await refreshAfterAction();
    } finally {
      refreshing = false;
    }
  }

  function handleActionSuccess() {
    clearTransactionData();
    refreshAfterAction();
  }

  async function handleAdjustPoints() {
    const cardId = selectedCard?.id;
    if (!cardId || !adjustPointsValue) return;
    const points = parseInt(adjustPointsValue);
    if (isNaN(points)) return;
    adjustingPoints = true;
    try {
      await cardActionsService.adjustPoints(programId, memberId, cardId, points, adjustPointsReason);
      adjustPointsOpen = false;
      adjustPointsValue = "";
      adjustPointsReason = "";
      clearTransactionData();
      await refreshAfterAction();
    } catch {
      toast.error('Failed to adjust points');
    } finally {
      adjustingPoints = false;
    }
  }

  async function activatePending(bucketId) {
    const cardId = selectedCard?.id;
    if (!cardId) return;
    processingBucket = bucketId;
    try {
      await cardActionsService.activatePending(programId, memberId, cardId, bucketId);
      await refreshAfterAction();
    } catch {
      toast.error('Failed to activate pending points');
    } finally {
      processingBucket = null;
    }
  }

  async function cancelPending(bucketId) {
    const cardId = selectedCard?.id;
    if (!cardId) return;
    processingBucket = bucketId;
    try {
      await cardActionsService.cancelPending(programId, memberId, cardId, bucketId);
      await refreshAfterAction();
    } catch {
      toast.error('Failed to cancel pending points');
    } finally {
      processingBucket = null;
    }
  }

  async function expirePoints(bucketId) {
    const cardId = selectedCard?.id;
    if (!cardId) return;
    processingBucket = bucketId;
    try {
      await cardActionsService.expirePoints(programId, memberId, cardId, bucketId);
      await refreshAfterAction();
    } catch {
      toast.error('Failed to expire points');
    } finally {
      processingBucket = null;
    }
  }

  function openRefundDialog(rewardTxId) {
    refundDialogTxId = rewardTxId;
    refundPolicyRefund = "DEFAULT";
    refundPolicyStock = "DEFAULT";
    refundDialogOpen = true;
  }

  async function refundRewardPurchase() {
    const txId = refundDialogTxId;
    if (!txId) return;
    processingRefund = txId;
    try {
      await cardActionsService.refundRewardPurchase(programId, txId, {
        refund: refundPolicyRefund,
        stock: refundPolicyStock,
      });
      refundDialogOpen = false;
      clearTransactionData();
      await refreshAfterAction();
    } catch {
      toast.error('Failed to refund reward purchase');
    } finally {
      processingRefund = null;
    }
  }

  function toggleRow(id) {
    expandedRows = { ...expandedRows, [id]: !expandedRows[id] };
  }

  function handleSelectCard(i) {
    selectedCardIndex = i;
    clearTransactionData();
    expandedRows = {};
    txSourceFilter = new Set(["Card", "Reward", "Order"]);
  }

  function goBack() {
    push(`/programs/${programId}`);
  }
</script>

<div class="p-6 space-y-6">
  {#if loadingMember}
    <div class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if !membership}
    <div class="bg-base-200/50 rounded-xl p-8 text-center">
      <p class="text-base-content/60 mb-4">Member not found</p>
      <button class="btn btn-primary btn-sm" onclick={goBack}>
        Back to Program
      </button>
    </div>
  {:else}
    <!-- Member Header Card -->
    <MemberHeader
      member={membership.member}
      {refreshing}
      onRefresh={refreshAll}
      onBack={goBack}
    />

    <!-- Card Summaries (clickable pills) -->
    <CardSummaryPills
      cards={membership.cards}
      onCardSelect={(i) => {
        selectedCardIndex = i;
      }}
      onAdjustPoints={() => {
        adjustPointsOpen = true;
        adjustPointsValue = "";
        adjustPointsReason = "";
      }}
      onPayWithPoints={() => {
        payWithPointsOpen = true;
      }}
    />

    <!-- Main Tabbed Section -->
    <div class="bg-base-200/50 rounded-xl overflow-hidden">
      <!-- Tab Navigation -->
      <div class="tabs tabs-bordered border-b border-base-300 px-4 shrink-0 flex-wrap gap-y-1">
        {#each TABS as tab (tab.id)}
          <button
            class="tab tab-sm {activeTab === tab.id ? 'tab-active' : ''}"
            onclick={() => (activeTab = tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </div>

      <!-- Tab Content -->
      <div class="p-5">
        {#if activeTab === "cards"}
          {#if membership.cards && membership.cards.length > 0}
            <!-- Card Selector -->
            <div class="mb-6">
              <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">
                Select Card
              </p>
              <div class="flex gap-2 flex-wrap">
                {#each membership.cards as mc, i (mc.card.id)}
                  {@const card = mc.card}
                  {@const isSelected = i === selectedCardIndex}
                  <button
                    class="btn btn-sm {isSelected ? 'btn-primary' : 'btn-outline'}"
                    onclick={() => handleSelectCard(i)}
                  >
                    {card?.code || card?.id || `Card ${i + 1}`}
                  </button>
                {/each}
              </div>
            </div>

            {#if selectedCardIndex !== null && selectedCard}
              <div class="space-y-6">
                <!-- Card Details -->
                <div>
                  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-4">
                    Card Details: {selectedCard.code || selectedCard.id}
                  </p>
                  <OverviewTab
                  isMemberMode={false}
                  membership={membership}
                  {programId}
                  {memberId}
                  {selectedCard}
                  {selectedMemberCard}
                  {pendingBuckets}
                  {expiringBuckets}
                  {loadingCardDetail}
                  {processingBucket}
                  {expandedRows}
                  onActivatePending={activatePending}
                  onCancelPending={cancelPending}
                  onExpirePoints={expirePoints}
                  onToggleRow={toggleRow}
                />
              </div>

              <!-- Point Reports -->
              <div>
                <CardReports {programId} {memberId} cardId={selectedCard.id} />
              </div>

              <!-- Card Activities -->
              <div>
                <ActivitiesTab
                  isMemberMode={false}
                  memberActivities={[]}
                  {cardActivities}
                  loading={loadingTx}
                  {expandedRows}
                  onToggleRow={toggleRow}
                  {getActivityTypeColor}
                />
              </div>

              <!-- Card Transactions -->
              <div>
                <TransactionFilterBar
                  bind:filters={txSourceFilter}
                  options={CARD_TX_FILTER_OPTIONS}
                />
                <TimelineTab
                  items={filteredCardTransactions}
                  loading={loadingCardTx}
                  {expandedRows}
                  {processingRefund}
                  onToggleRow={toggleRow}
                  onOpenRefund={openRefundDialog}
                />
              </div>
            </div>
            {:else}
              <div class="text-center py-12">
                <p class="text-base-content/60">No card selected</p>
                <p class="text-sm text-base-content/40 mt-2">Select a card above to view details</p>
              </div>
            {/if}
          {:else}
            <div class="text-center py-12">
              <p class="text-base-content/60">No cards available</p>
              <p class="text-sm text-base-content/40 mt-2">This member has no cards assigned</p>
            </div>
          {/if}
        {:else if activeTab === "earning"}
          <!-- Earning Possibilities Tab -->
          <EarningsExaminationTab {programId} {memberId} membership={membership} />
        {:else if activeTab === "spending"}
          <!-- Spending Possibilities Tab -->
          <SpendingExaminationTab {programId} {memberId} membership={membership} />
        {:else if activeTab === "activities"}
          <ActivitiesTab
            isMemberMode={true}
            {memberActivities}
            cardActivities={[]}
            loading={loadingTx}
            {expandedRows}
            onToggleRow={toggleRow}
            {getActivityTypeColor}
          />
        {:else if activeTab === "benefits"}
          <TransactionFilterBar
            bind:filters={memberTxSourceFilter}
            options={MEMBER_TX_FILTER_OPTIONS}
          />
          <TimelineTab
            items={filteredMemberTransactions}
            loading={loadingMemberTx}
            {expandedRows}
            processingRefund={null}
            onToggleRow={toggleRow}
            onOpenRefund={() => {}}
          />
        {:else if activeTab === "json"}
          <RawJsonTab data={membership} />
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Action modals -->
<CreateOrderModal
  open={createOrderOpen}
  customerId={membership?.member?.customer_id ?? ""}
  onClose={() => {
    createOrderOpen = false;
  }}
  onSuccess={handleActionSuccess}
/>

<TriggerCustomEventModal
  open={triggerEventOpen}
  customerId={membership?.member?.customer_id ?? ""}
  onClose={() => {
    triggerEventOpen = false;
  }}
  onSuccess={handleActionSuccess}
/>

<PurchaseRewardModal
  open={purchaseRewardOpen}
  card={selectedCard}
  {programId}
  {memberId}
  onClose={() => {
    purchaseRewardOpen = false;
  }}
  onSuccess={handleActionSuccess}
/>

<PayWithPointsModal
  open={payWithPointsOpen}
  card={selectedCard}
  membership={membership}
  {programId}
  {memberId}
  onClose={() => {
    payWithPointsOpen = false;
  }}
  onSuccess={handleActionSuccess}
/>

<AdjustPointsDialog
  open={adjustPointsOpen}
  {selectedCard}
  bind:adjustPointsValue
  bind:adjustPointsReason
  adjusting={adjustingPoints}
  onConfirm={handleAdjustPoints}
  onClose={() => {
    adjustPointsOpen = false;
  }}
/>

<RefundDialog
  open={refundDialogOpen}
  txId={refundDialogTxId}
  bind:refundPolicyRefund
  bind:refundPolicyStock
  processing={processingRefund}
  onConfirm={refundRewardPurchase}
  onClose={() => {
    refundDialogOpen = false;
  }}
/>
