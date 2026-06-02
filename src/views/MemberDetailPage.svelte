<script>
  import { untrack } from "svelte";
  import { router, push } from "svelte-spa-router";
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { toast } from "../services/toast.js";
  import CreateOrderModal from "../components/CreateOrderModal.svelte";
  import PayWithPointsModal from "../components/PayWithPointsModal.svelte";
  import PurchaseRewardModal from "../components/PurchaseRewardModal.svelte";
  import TriggerCustomEventModal from "../components/TriggerCustomEventModal.svelte";
  import MemberActionToolbar from "../components/member/MemberActionToolbar.svelte";
  import MemberCardSection from "../components/member/MemberCardSection.svelte";
  import CardReports from "../components/member/CardReports.svelte";
  import AdjustPointsDialog from "../components/member/dialogs/AdjustPointsDialog.svelte";
  import ExamineDialog from "../components/member/dialogs/ExamineDialog.svelte";
  import RefundDialog from "../components/member/dialogs/RefundDialog.svelte";
  import ActivitiesTab from "../components/member/tabs/ActivitiesTab.svelte";
  import OverviewTab from "../components/member/tabs/OverviewTab.svelte";
  import RawJsonTab from "../components/member/tabs/RawJsonTab.svelte";
  import TimelineTab from "../components/member/tabs/TimelineTab.svelte";

  const programId = $derived(router.params.programId);
  const memberId = $derived(router.params.memberId);

  // ── Core data ────────────────────────────────────────────────────────────────
  let member = $state(null);
  let loadingMember = $state(false);
  let selectedCardIndex = $state(null);
  let activeTab = $state("timeline");

  // ── Per-card overview data ────────────────────────────────────────────────────
  let pendingBuckets = $state([]);
  let expiringBuckets = $state([]);
  let loadingCardDetail = $state(false);
  let processingBucket = $state(null);

  // ── Transaction lists ─────────────────────────────────────────────────────────
  let timelineActivities = $state([]);
  let memberActivities = $state([]);
  let cardActivities = $state([]);
  let loadingTx = $state(false);
  let expandedRows = $state({});

  // ── Modal / dialog visibility ─────────────────────────────────────────────────
  let adjustPointsOpen = $state(false);
  let adjustPointsValue = $state("");
  let adjustPointsReason = $state("");
  let adjustingPoints = $state(false);
  let purchaseRewardOpen = $state(false);
  let payWithPointsOpen = $state(false);
  let createOrderOpen = $state(false);
  let triggerEventOpen = $state(false);
  let examineOpen = $state(false);
  let examineAmount = $state("");
  let examineResult = $state(null);
  let examineError = $state(null);
  let examineSubmitting = $state(false);
  let examineJsonExpanded = $state(false);
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
      ? (member?.cards?.[selectedCardIndex] ?? null)
      : null,
  );
  const selectedCard = $derived(selectedMemberCard?.card ?? null);

  const TABS = [
    { id: "timeline", label: "Timeline" },
    { id: "activities", label: "Activities" },
    { id: "rawJson", label: "Raw JSON" },
  ];

  // ── Effects ───────────────────────────────────────────────────────────────────
  $effect(() => {
    if (programId && memberId) {
      fetchMember();
    }
  });

  $effect(() => {
    if (member && selectedCardIndex !== null) {
      const card = member.cards?.[selectedCardIndex];
      if (card?.card?.id) {
        expandedRows = {};
        fetchCardOverview(card.card.id);
      }
    }
  });

  $effect(() => {
    if (!member) return;

    if (activeTab === "timeline") fetchTimeline();
    else if (activeTab === "activities") fetchMemberActivities();
  });

  // ── Data fetching ─────────────────────────────────────────────────────────────
  async function fetchMember() {
    loadingMember = true;
    try {
      member = await api.get(endpoints.members.get(programId, memberId));
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
      const [pendingRes, expiringRes] = await Promise.all([
        api
          .get(endpoints.members.pendingPoints(programId, memberId, cardId))
          .catch(() => ({ data: [] })),
        api
          .get(endpoints.members.expiringPoints(programId, memberId, cardId))
          .catch(() => ({ data: [] })),
      ]);
      pendingBuckets = pendingRes.data || [];
      expiringBuckets = expiringRes.data || [];
    } finally {
      loadingCardDetail = false;
    }
  }

  async function fetchTimeline() {
    if (untrack(() => timelineActivities.length) > 0) return;
    const cardId = untrack(() => selectedCard?.id);
    loadingTx = true;
    try {
      const [cardRes, rewardRes, orderRes, incentiveRes] = await Promise.all([
        cardId
          ? api.get(
              endpoints.members.cardTransactions(programId, memberId, cardId, {
                limit: 50,
              }),
            )
          : Promise.resolve({ data: [] }),
        api.get(
          endpoints.members.rewardPurchases(programId, memberId, { limit: 50 }),
        ),
        api.get(
          endpoints.members.orderPayments(programId, memberId, { limit: 50 }),
        ),
        api.get(
          endpoints.members.incentiveTransactions(programId, memberId, {
            limit: 50,
          }),
        ),
      ]);

      const allCardTxs = (cardRes.data || []).map((t) => ({
        ...t,
        _source: "Card",
      }));

      const allRewards = rewardRes.data || [];
      const allOrders = orderRes.data || [];
      const rewardTxs = (
        cardId ? allRewards.filter((r) => r.card_id === cardId) : allRewards
      ).map((t) => ({ ...t, _source: "Reward" }));
      const orderTxs = (
        cardId ? allOrders.filter((o) => o.card_id === cardId) : allOrders
      ).map((t) => ({ ...t, _source: "Order" }));
      const incentiveTxs = (incentiveRes.data || []).map((t) => ({
        ...t,
        _source: "Incentive",
      }));

      const cardTxById = {};
      for (const ct of allCardTxs) cardTxById[ct.id] = ct;
      const consumedCardTxIds = new Set();
      for (const tx of [...rewardTxs, ...orderTxs]) {
        if (tx.card_transaction_id && cardTxById[tx.card_transaction_id]) {
          tx._childCardTx = cardTxById[tx.card_transaction_id];
          consumedCardTxIds.add(tx.card_transaction_id);
        }
      }

      const all = [
        ...allCardTxs.filter((ct) => !consumedCardTxIds.has(ct.id)),
        ...rewardTxs,
        ...orderTxs,
        ...incentiveTxs,
      ];
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      timelineActivities = all;
    } catch {
      toast.error('Failed to fetch timeline');
    } finally {
      loadingTx = false;
    }
  }

  async function fetchMemberActivities() {
    if (untrack(() => memberActivities.length) > 0) return;
    loadingTx = true;
    try {
      const res = await api.get(
        endpoints.members.activities(programId, memberId),
      );
      memberActivities = res.data || [];
    } catch {
      toast.error('Failed to fetch member activities');
    } finally {
      loadingTx = false;
    }
  }

  function clearTransactionData() {
    timelineActivities = [];
    memberActivities = [];
    expandedRows = {};
  }

  // ── Actions ───────────────────────────────────────────────────────────────────
  function getActivityTypeColor(type) {
    if (!type) return "badge-neutral";
    const t = String(type).toUpperCase();
    if (t.includes("CREATE")) return "badge-success";
    if (t.includes("UPDATE") || t.includes("MODIFY")) return "badge-info";
    if (t.includes("DELETE") || t.includes("REMOVE")) return "badge-error";
    if (t.includes("ACTIVATE")) return "badge-primary";
    if (t.includes("DEACTIVATE") || t.includes("DRAFT")) return "badge-warning";
    if (t.includes("ASSIGN")) return "badge-accent";
    return "badge-neutral";
  }

  async function refreshAfterAction() {
    const cardId = member?.cards?.[selectedCardIndex]?.card?.id;
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
      await api.post(
        endpoints.members.adjustPoints(programId, memberId, cardId),
        {
          points,
          reason: adjustPointsReason || undefined,
        },
      );
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

  async function handleExamine() {
    const amount = parseInt(examineAmount);
    if (isNaN(amount) || amount <= 0) return;
    examineSubmitting = true;
    examineResult = null;
    examineError = null;
    try {
      examineResult = await api.post(endpoints.examine.run(), {
        event: "customer.order.paid",
        customer_identification: { type: "member_id", member_id: memberId },
        customer_order_paid: { order: { amount } },
      });
    } catch (err) {
      examineError = err.message || "Examination failed";
    } finally {
      examineSubmitting = false;
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
      await api.post(endpoints.members.refundRewardPurchase(programId, txId), {
        policies: { refund: refundPolicyRefund, stock: refundPolicyStock },
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

  async function activatePending(bucketId) {
    const cardId = selectedCard?.id;
    if (!cardId) return;
    processingBucket = bucketId;
    try {
      await api.post(
        endpoints.members.activatePendingPoints(
          programId,
          memberId,
          cardId,
          bucketId,
        ),
        {},
      );
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
      await api.post(
        endpoints.members.cancelPendingPoints(
          programId,
          memberId,
          cardId,
          bucketId,
        ),
        {},
      );
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
      await api.post(
        endpoints.members.expirePoints(programId, memberId, cardId, bucketId),
        {},
      );
      await refreshAfterAction();
    } catch {
      toast.error('Failed to expire points');
    } finally {
      processingBucket = null;
    }
  }

  function toggleRow(id) {
    expandedRows = { ...expandedRows, [id]: !expandedRows[id] };
  }

  function handleSelectCard(i) {
    selectedCardIndex = i;
    clearTransactionData();
    expandedRows = {};
  }

  function handleAdjustPointsForCard(cardIndex) {
    selectedCardIndex = cardIndex;
    adjustPointsOpen = true;
    adjustPointsValue = "";
    adjustPointsReason = "";
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
  {:else if !member}
    <div class="bg-base-200/50 rounded-xl p-8 text-center">
      <p class="text-base-content/60 mb-4">Member not found</p>
      <button class="btn btn-primary btn-sm" onclick={goBack}>
        Back to Program
      </button>
    </div>
  {:else}
    <!-- Member Header Card -->
    <div class="bg-base-200/50 rounded-xl p-5">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3 flex-1">
          <button
            class="btn btn-ghost btn-sm btn-circle"
            onclick={goBack}
            title="Back to program"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold">Member: {member.id}</h1>
            {#if member.customer_id}
              <p class="text-sm text-base-content/60 mt-1">Customer: {member.customer_id}</p>
            {/if}
          </div>
        </div>
        <button
          class="btn btn-sm btn-ghost"
          onclick={refreshAll}
          disabled={refreshing}
        >
          {#if refreshing}
            <span class="loading loading-spinner loading-xs"></span>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          {/if}
          Refresh
        </button>
      </div>
    </div>

    <!-- Cards Section -->
    <div class="bg-base-200/50 rounded-xl p-5 space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">
          Cards <span class="badge badge-xs badge-ghost ml-1 normal-case">{member.cards?.length ?? 0}</span>
        </p>
      </div>
      <MemberCardSection
        cards={member.cards ?? []}
        {selectedCardIndex}
        onSelectCard={handleSelectCard}
        onAdjustPoints={handleAdjustPointsForCard}
      />
    </div>

    <!-- Selected Card Details (when card selected) -->
    {#if selectedCardIndex !== null && selectedCard}
      <div class="bg-base-200/50 rounded-xl p-5">
        <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-4">
          Card Details: {selectedCard.code || selectedCard.id}
        </p>
        <OverviewTab
          isMemberMode={false}
          {member}
          {programId}
          {memberId}
          {selectedCard}
          {selectedMemberCard}
          {pendingBuckets}
          {expiringBuckets}
          {loadingCardDetail}
          {processingBucket}
          onAdjustPoints={() => {
            adjustPointsOpen = true;
            adjustPointsValue = "";
            adjustPointsReason = "";
          }}
          onActivatePending={activatePending}
          onCancelPending={cancelPending}
          onExpirePoints={expirePoints}
        />
      </div>

      <!-- Point Reports Section (only when card selected) -->
      <div class="bg-base-200/50 rounded-xl p-5">
        <CardReports {programId} {memberId} cardId={selectedCard.id} />
      </div>
    {/if}

    <!-- Quick Actions -->
    <div class="bg-base-200/50 rounded-xl overflow-hidden">
      <MemberActionToolbar
        onPurchaseReward={() => {
          purchaseRewardOpen = true;
        }}
        onPayWithPoints={() => {
          payWithPointsOpen = true;
        }}
        onCreateOrder={() => {
          createOrderOpen = true;
        }}
        onTriggerEvent={() => {
          triggerEventOpen = true;
        }}
        onExamineEarnings={() => {
          examineOpen = true;
          examineAmount = "";
          examineResult = null;
          examineError = null;
          examineJsonExpanded = false;
        }}
      />
    </div>

    <!-- Earnings Examination Section -->
    <div class="bg-base-200/50 rounded-xl p-5">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Earnings Examination</p>
      </div>
      <div class="text-center py-8">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto mb-3 text-base-content/40">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
        <p class="text-sm text-base-content/60 mb-4">
          See what actions this member can do to earn points
        </p>
        <button
          class="btn btn-info btn-sm"
          onclick={() => {
            examineOpen = true;
            examineAmount = "";
            examineResult = null;
            examineError = null;
            examineJsonExpanded = false;
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Examine Earnings
        </button>
      </div>
    </div>

    <!-- Rewards Examination Section -->
    <div class="bg-base-200/50 rounded-xl p-5">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Rewards Examination</p>
      </div>
      <div class="text-center py-8">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-12 h-12 mx-auto mb-3 text-base-content/40">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <p class="text-sm text-base-content/60 mb-4">
          See what rewards this member can spend points on
        </p>
        <button
          class="btn btn-primary btn-sm"
          onclick={() => {
            purchaseRewardOpen = true;
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          Examine Rewards
        </button>
      </div>
    </div>

    <!-- Timeline & Activities Section -->
    <div class="bg-base-200/50 rounded-xl p-5">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">Activity & History</p>
      </div>

      <div class="tabs tabs-bordered border-b border-base-300 shrink-0 flex-wrap gap-y-1">
        {#each TABS as tab}
          <button
            class="tab tab-sm {activeTab === tab.id ? 'tab-active' : ''}"
            onclick={() => (activeTab = tab.id)}
          >
            {tab.label}
          </button>
        {/each}
      </div>

      <div class="py-5">
        {#if activeTab === "timeline"}
          <TimelineTab
            items={timelineActivities}
            loading={loadingTx}
            {expandedRows}
            {processingRefund}
            onToggleRow={toggleRow}
            onOpenRefund={openRefundDialog}
          />
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
        {:else if activeTab === "rawJson"}
          <RawJsonTab {member} />
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Action modals -->
<CreateOrderModal
  open={createOrderOpen}
  customerId={member?.customer_id ?? ""}
  onClose={() => {
    createOrderOpen = false;
  }}
  onSuccess={handleActionSuccess}
/>

<TriggerCustomEventModal
  open={triggerEventOpen}
  customerId={member?.customer_id ?? ""}
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

<ExamineDialog
  open={examineOpen}
  {memberId}
  bind:examineAmount
  bind:examineResult
  bind:examineError
  {examineSubmitting}
  bind:examineJsonExpanded
  onConfirm={handleExamine}
  onClose={() => {
    examineOpen = false;
  }}
  onRunAgain={() => {
    examineResult = null;
    examineError = null;
  }}
/>
