<script>
  import { untrack } from "svelte";
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { toast } from "../services/toast.js";
  import CreateOrderModal from "./CreateOrderModal.svelte";
  import PayWithPointsModal from "./PayWithPointsModal.svelte";
  import PurchaseRewardModal from "./PurchaseRewardModal.svelte";
  import TriggerCustomEventModal from "./TriggerCustomEventModal.svelte";
  import MemberActionToolbar from "./member/MemberActionToolbar.svelte";
  import MemberCardSidebar from "./member/MemberCardSidebar.svelte";
  import MemberHeader from "./member/MemberHeader.svelte";
  import AdjustPointsDialog from "./member/dialogs/AdjustPointsDialog.svelte";
  import ExamineDialog from "./member/dialogs/ExamineDialog.svelte";
  import RefundDialog from "./member/dialogs/RefundDialog.svelte";
  import ActivitiesTab from "./member/tabs/ActivitiesTab.svelte";
  import OverviewTab from "./member/tabs/OverviewTab.svelte";
  import RawJsonTab from "./member/tabs/RawJsonTab.svelte";
  import TimelineTab from "./member/tabs/TimelineTab.svelte";
  import TransactionsTab from "./member/tabs/TransactionsTab.svelte";

  let {
    open = false,
    programId = null,
    memberId = null,
    onClose = () => {},
  } = $props();

  // ── Core data ────────────────────────────────────────────────────────────────
  let member = $state(null);
  let loadingMember = $state(false);
  let selectedCardIndex = $state(null); // null = member mode
  let activeTab = $state("overview");

  // ── Per-card overview data ────────────────────────────────────────────────────
  let pendingBuckets = $state([]);
  let expiringBuckets = $state([]);
  let loadingCardDetail = $state(false);
  let processingBucket = $state(null);

  // ── Transaction lists ─────────────────────────────────────────────────────────
  let cardTransactions = $state([]);
  let rewardPurchases = $state([]);
  let orderPayments = $state([]);
  let incentiveTransactions = $state([]);
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

  // Member mode: member-level APIs (no card filter available)
  // Card mode: card-scoped APIs + timeline (card transactions linked with matching member transactions)
  const TABS = $derived(
    isMemberMode
      ? [
          { id: "overview", label: "Overview" },
          { id: "rewards", label: "Reward Purchases" },
          { id: "orders", label: "Order Payments" },
          { id: "incentives", label: "Incentives" },
          { id: "timeline", label: "Timeline" },
          { id: "activities", label: "Activities" },
          { id: "rawJson", label: "Raw JSON" },
        ]
      : [
          { id: "overview", label: "Overview" },
          { id: "cardTx", label: "Card Transactions" },
          { id: "timeline", label: "Timeline" },
          { id: "activities", label: "Activities" },
          { id: "rawJson", label: "Raw JSON" },
        ],
  );

  // Tabs that only exist in member mode — switching to card mode resets activeTab if on one of these
  const MEMBER_ONLY_TAB_IDS = new Set(["rewards", "orders", "incentives"]);

  // ── Effects ───────────────────────────────────────────────────────────────────
  $effect(() => {
    if (open && programId && memberId) fetchMember();
    else if (!open) resetState();
  });

  // Load card-specific overview data when a card is selected
  $effect(() => {
    if (member && selectedCardIndex !== null) {
      const card = member.cards?.[selectedCardIndex];
      if (card?.card?.id) {
        activeTab = "overview";
        expandedRows = {};
        fetchCardOverview(card.card.id);
      }
    }
  });

  // Load tab data reactively based on active tab and current mode
  $effect(() => {
    const cardId = member?.cards?.[selectedCardIndex]?.card?.id;
    if (!member) return;
    if (!isMemberMode && !cardId) return;

    // cardTx is only available in card mode; rewards/orders/incentives/timeline only in member mode
    if (activeTab === "cardTx" && cardId) fetchCardTransactions(cardId);
    else if (activeTab === "rewards") fetchRewardPurchases();
    else if (activeTab === "orders") fetchOrderPayments();
    else if (activeTab === "incentives") fetchIncentiveTransactions();
    else if (activeTab === "timeline") fetchTimeline();
    else if (activeTab === "activities") {
      if (isMemberMode) fetchMemberActivities();
      else fetchCardActivities();
    }
  });

  // ── State reset ───────────────────────────────────────────────────────────────
  function resetState() {
    member = null;
    selectedCardIndex = null;
    activeTab = "overview";
    pendingBuckets = [];
    expiringBuckets = [];
    loadingMember = false;
    loadingCardDetail = false;
    processingBucket = null;
    adjustPointsOpen = false;
    adjustPointsValue = "";
    adjustPointsReason = "";
    adjustingPoints = false;
    purchaseRewardOpen = false;
    payWithPointsOpen = false;
    createOrderOpen = false;
    triggerEventOpen = false;
    examineOpen = false;
    examineAmount = "";
    examineResult = null;
    examineError = null;
    examineSubmitting = false;
    examineJsonExpanded = false;
    clearTransactionData();
  }

  function clearTransactionData() {
    cardTransactions = [];
    rewardPurchases = [];
    orderPayments = [];
    incentiveTransactions = [];
    timelineActivities = [];
    memberActivities = [];
    cardActivities = [];
    expandedRows = {};
  }

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

  async function fetchCardTransactions(cardId) {
    if (untrack(() => cardTransactions.length) > 0) return;
    loadingTx = true;
    try {
      const res = await api.get(
        endpoints.members.cardTransactions(programId, memberId, cardId, {
          limit: 50,
        }),
      );
      cardTransactions = res.data || [];
    } catch {
      toast.error('Failed to fetch card transactions');
    } finally {
      loadingTx = false;
    }
  }

  async function fetchRewardPurchases() {
    if (untrack(() => rewardPurchases.length) > 0) return;
    loadingTx = true;
    try {
      const res = await api.get(
        endpoints.members.rewardPurchases(programId, memberId, { limit: 50 }),
      );
      rewardPurchases = res.data || [];
    } catch {
      toast.error('Failed to fetch reward purchases');
    } finally {
      loadingTx = false;
    }
  }

  async function fetchOrderPayments() {
    if (untrack(() => orderPayments.length) > 0) return;
    loadingTx = true;
    try {
      const res = await api.get(
        endpoints.members.orderPayments(programId, memberId, { limit: 50 }),
      );
      orderPayments = res.data || [];
    } catch {
      toast.error('Failed to fetch order payments');
    } finally {
      loadingTx = false;
    }
  }

  async function fetchIncentiveTransactions() {
    if (untrack(() => incentiveTransactions.length) > 0) return;
    loadingTx = true;
    try {
      const res = await api.get(
        endpoints.members.incentiveTransactions(programId, memberId, {
          limit: 50,
        }),
      );
      incentiveTransactions = res.data || [];
    } catch {
      toast.error('Failed to fetch incentive transactions');
    } finally {
      loadingTx = false;
    }
  }

  async function fetchTimeline() {
    if (untrack(() => timelineActivities.length) > 0) return;
    const cardId = untrack(() => selectedCard?.id);
    loadingTx = true;
    try {
      const [cardRes, rewardRes, orderRes, incentiveRes] = await Promise.all([
        // Card transactions only available when a card is selected
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

      // In card mode, filter rewards and orders to those belonging to this card
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

      // Link card transactions that are referenced by a reward or order row as child rows
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

  async function fetchCardActivities() {
    const cardId = selectedCard?.id;
    if (!cardId || untrack(() => cardActivities.length) > 0) return;
    loadingTx = true;
    try {
      const res = await api.get(
        endpoints.members.cardActivities(programId, memberId, cardId),
      );
      cardActivities = res.data || [];
    } catch {
      toast.error('Failed to fetch card activities');
    } finally {
      loadingTx = false;
    }
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
    if (i === null) {
      // Switching to member mode: clear card-specific data, reset to overview
      pendingBuckets = [];
      expiringBuckets = [];
      activeTab = "overview";
      expandedRows = {};
    } else {
      // Switching to card mode: reset tab if on a member-only tab
      if (MEMBER_ONLY_TAB_IDS.has(activeTab)) {
        activeTab = "overview";
      }
      expandedRows = {};
    }
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape" && open) onClose();
  }}
/>

{#if open}
  <div
    class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    onclick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}
    onkeydown={(e) => {
      if (e.key === "Escape") onClose();
    }}
    role="dialog"
    aria-modal="true"
    aria-label="Member details"
    tabindex="-1"
  >
    <div
      class="bg-base-100 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden"
    >
      <MemberHeader
        {member}
        {loadingMember}
        {refreshing}
        onRefresh={refreshAll}
        {onClose}
      />

      <div class="flex flex-1 overflow-hidden">
        {#if loadingMember}
          <div class="flex-1 flex items-center justify-center">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
        {:else if !member}
          <div
            class="flex-1 flex items-center justify-center text-base-content/40 text-sm"
          >
            Failed to load member
          </div>
        {:else}
          <MemberCardSidebar
            cards={member.cards ?? []}
            {selectedCardIndex}
            onSelectCard={handleSelectCard}
          />

          <div class="flex-1 flex flex-col overflow-hidden">
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

            <!-- Tab bar -->
            <div
              class="tabs tabs-bordered border-b border-base-300 px-4 pt-3 shrink-0 flex-wrap gap-y-1"
            >
              {#each TABS as tab}
                <button
                  class="tab tab-sm {activeTab === tab.id ? 'tab-active' : ''}"
                  onclick={() => (activeTab = tab.id)}
                >
                  {tab.label}
                </button>
              {/each}
            </div>

            <!-- Tab content -->
            <div class="flex-1 overflow-y-auto p-5">
              {#if activeTab === "overview"}
                <OverviewTab
                  {isMemberMode}
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
              {:else if activeTab === "cardTx"}
                <TransactionsTab
                  kind="cardTx"
                  items={cardTransactions}
                  loading={loadingTx}
                  {expandedRows}
                  {processingRefund}
                  onToggleRow={toggleRow}
                  onOpenRefund={openRefundDialog}
                />
              {:else if activeTab === "rewards"}
                <TransactionsTab
                  kind="rewards"
                  items={rewardPurchases}
                  loading={loadingTx}
                  {expandedRows}
                  {processingRefund}
                  onToggleRow={toggleRow}
                  onOpenRefund={openRefundDialog}
                />
              {:else if activeTab === "orders"}
                <TransactionsTab
                  kind="orders"
                  items={orderPayments}
                  loading={loadingTx}
                  {expandedRows}
                  {processingRefund}
                  onToggleRow={toggleRow}
                  onOpenRefund={openRefundDialog}
                />
              {:else if activeTab === "incentives"}
                <TransactionsTab
                  kind="incentives"
                  items={incentiveTransactions}
                  loading={loadingTx}
                  {expandedRows}
                  {processingRefund}
                  onToggleRow={toggleRow}
                  onOpenRefund={openRefundDialog}
                />
              {:else if activeTab === "timeline"}
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
                  {isMemberMode}
                  {memberActivities}
                  {cardActivities}
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
    </div>
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
{/if}
