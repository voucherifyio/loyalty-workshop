<script>
  import { untrack } from "svelte";
  import { router, push } from "svelte-spa-router";
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { toast } from "../services/toast.js";
  import { formatNum } from "../utils/transactionFormatting.js";
  import CreateOrderModal from "../components/CreateOrderModal.svelte";
  import PayWithPointsModal from "../components/PayWithPointsModal.svelte";
  import PurchaseRewardModal from "../components/PurchaseRewardModal.svelte";
  import TriggerCustomEventModal from "../components/TriggerCustomEventModal.svelte";
  import CardReports from "../components/member/CardReports.svelte";
  import AdjustPointsDialog from "../components/member/dialogs/AdjustPointsDialog.svelte";
  import ExamineDialog from "../components/member/dialogs/ExamineDialog.svelte";
  import RefundDialog from "../components/member/dialogs/RefundDialog.svelte";
  import ActivitiesTab from "../components/member/tabs/ActivitiesTab.svelte";
  import EarningsExaminationTab from "../components/member/tabs/EarningsExaminationTab.svelte";
  import SpendingExaminationTab from "../components/member/tabs/SpendingExaminationTab.svelte";
  import OverviewTab from "../components/member/tabs/OverviewTab.svelte";
  import RawJsonTab from "../components/member/tabs/RawJsonTab.svelte";
  import TimelineTab from "../components/member/tabs/TimelineTab.svelte";

  const programId = $derived(router.params.programId);
  const memberId = $derived(router.params.memberId);

  // ── Core data ────────────────────────────────────────────────────────────────
  let member = $state(null);
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
  let memberTxSourceFilter = $state(new Set(["Incentive", "Tier"]));

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
  let actionCardIndex = $state(null);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const isMemberMode = $derived(selectedCardIndex === null);
  const selectedMemberCard = $derived(
    selectedCardIndex !== null
      ? (member?.cards?.[selectedCardIndex] ?? null)
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
    { id: "incentives", label: "Transactions" },
    { id: "json", label: "JSON" },
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
        fetchCardActivities(card.card.id);
        fetchCardTransactions(card.card.id);
      }
    }
  });

  $effect(() => {
    if (!member) return;

    if (activeTab === "activities") fetchMemberActivities();
    else if (activeTab === "incentives") fetchMemberTransactions();
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

  async function fetchCardActivities(cardId) {
    if (untrack(() => cardActivities.length) > 0) return;
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

  async function fetchCardTransactions(cardId) {
    if (untrack(() => cardTransactions.length) > 0) return;
    loadingCardTx = true;
    try {
      const [cardRes, rewardRes, orderRes] = await Promise.all([
        api.get(
          endpoints.members.cardTransactions(programId, memberId, cardId, {
            limit: 50,
          }),
        ),
        api.get(
          endpoints.members.rewardPurchases(programId, memberId, { limit: 50 }),
        ),
        api.get(
          endpoints.members.orderPayments(programId, memberId, { limit: 50 }),
        ),
      ]);

      const allCardTxs = (cardRes.data || []).map((t) => ({
        ...t,
        _source: "Card",
      }));

      const allRewards = rewardRes.data || [];
      const allOrders = orderRes.data || [];
      const rewardTxs = allRewards
        .filter((r) => r.card_id === cardId)
        .map((t) => ({ ...t, _source: "Reward" }));
      const orderTxs = allOrders
        .filter((o) => o.card_id === cardId)
        .map((t) => ({ ...t, _source: "Order" }));

      // Link child card transactions to rewards/orders
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
      ];
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      cardTransactions = all;
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
      const [incentiveRes, tierRes] = await Promise.all([
        api.get(
          endpoints.members.incentiveTransactions(programId, memberId, {
            limit: 50,
          }),
        ),
        api.get(
          endpoints.members.tierTransactions(programId, memberId, {
            limit: 50,
          }),
        ),
      ]);
      
      const incentiveTxs = (incentiveRes.data || []).map((t) => ({
        ...t,
        _source: "Incentive",
      }));
      const tierTxs = (tierRes.data || []).map((t) => ({
        ...t,
        _source: "Tier",
      }));
      
      const all = [...incentiveTxs, ...tierTxs];
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      memberTransactions = all;
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

  function toggleRow(id) {
    expandedRows = { ...expandedRows, [id]: !expandedRows[id] };
  }

  function toggleTxSourceFilter(source) {
    const newFilter = new Set(txSourceFilter);
    if (newFilter.has(source)) {
      newFilter.delete(source);
    } else {
      newFilter.add(source);
    }
    txSourceFilter = newFilter;
  }

  function toggleMemberTxSourceFilter(source) {
    const newFilter = new Set(memberTxSourceFilter);
    if (newFilter.has(source)) {
      newFilter.delete(source);
    } else {
      newFilter.add(source);
    }
    memberTxSourceFilter = newFilter;
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

    <!-- Card Summaries (clickable pills) -->
    {#if member.cards && member.cards.length > 0}
      <div class="bg-base-200/50 rounded-xl p-5">
        <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">
          Cards <span class="badge badge-xs badge-ghost ml-1 normal-case">{member.cards.length}</span>
        </p>
        <div class="flex gap-3 overflow-x-auto pb-2">
          {#each member.cards as mc, i}
            {@const card = mc.card}
            {@const tp = mc.tier_progress?.current}
            <div class="bg-base-100 rounded-lg p-3 min-w-48 shrink-0 shadow-sm flex flex-col">
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50 mb-0.5">
                    {card?.card_type || mc.member_role || 'Card'}
                  </p>
                  <p class="text-xs font-mono truncate font-medium">{card?.code || card?.id || '–'}</p>
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <p class="text-2xl font-bold text-primary">{formatNum(card?.balance?.points ?? 0)}</p>
                <p class="text-[10px] text-base-content/40">pts</p>
              </div>
              {#if tp}
                {@const pct = Math.min(100, Math.round(((tp.points.current - tp.points.min) / Math.max(tp.points.max - tp.points.min, 1)) * 100))}
                <div class="mt-2 pt-2 border-t border-base-300">
                  <p class="text-[9px] text-base-content/50 mb-1">{tp.name}</p>
                  <div class="h-1 rounded-full bg-base-300 overflow-hidden">
                    <div class="h-full rounded-full bg-primary transition-all" style="width: {Math.max(pct, 2)}%"></div>
                  </div>
                </div>
              {/if}
              
              <!-- Action Buttons -->
              <div class="mt-auto pt-3 border-t border-base-300 flex gap-2" class:mt-3={!tp}>
                <button 
                  class="btn btn-xs btn-outline flex-1"
                  onclick={() => {
                    actionCardIndex = i;
                    selectedCardIndex = i;
                    adjustPointsOpen = true;
                    adjustPointsValue = "";
                    adjustPointsReason = "";
                  }}
                  title="Adjust card balance"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Adjust
                </button>
                <button 
                  class="btn btn-xs btn-primary flex-1"
                  onclick={() => {
                    actionCardIndex = i;
                    selectedCardIndex = i;
                    payWithPointsOpen = true;
                  }}
                  title="Pay for an order with points"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  Pay
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Main Tabbed Section -->
    <div class="bg-base-200/50 rounded-xl overflow-hidden">
      <!-- Tab Navigation -->
      <div class="tabs tabs-bordered border-b border-base-300 px-4 shrink-0 flex-wrap gap-y-1">
        {#each TABS as tab}
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
          {#if member.cards && member.cards.length > 0}
            <!-- Card Selector -->
            <div class="mb-6">
              <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">
                Select Card
              </p>
              <div class="flex gap-2 flex-wrap">
                {#each member.cards as mc, i}
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
                  {member}
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
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-3">
                    <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">
                      Filter Transactions
                    </p>
                  </div>
                  <div class="flex gap-2 flex-wrap">
                    <button
                      class="btn btn-sm {txSourceFilter.has('Card') ? 'btn-info' : 'btn-outline'}"
                      onclick={() => toggleTxSourceFilter('Card')}
                    >
                      <span class="badge badge-xs badge-info mr-1"></span>
                      Card
                    </button>
                    <button
                      class="btn btn-sm {txSourceFilter.has('Reward') ? 'btn-accent' : 'btn-outline'}"
                      onclick={() => toggleTxSourceFilter('Reward')}
                    >
                      <span class="badge badge-xs badge-accent mr-1"></span>
                      Reward
                    </button>
                    <button
                      class="btn btn-sm {txSourceFilter.has('Order') ? 'btn-warning' : 'btn-outline'}"
                      onclick={() => toggleTxSourceFilter('Order')}
                    >
                      <span class="badge badge-xs badge-warning mr-1"></span>
                      Order
                    </button>
                  </div>
                </div>
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
          <EarningsExaminationTab {programId} {memberId} {member} />
        {:else if activeTab === "spending"}
          <!-- Spending Possibilities Tab -->
          <SpendingExaminationTab {programId} {memberId} {member} />
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
        {:else if activeTab === "incentives"}
          <div class="mb-4">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest">
                Filter Transactions
              </p>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button
                class="btn btn-sm {memberTxSourceFilter.has('Incentive') ? 'btn-success' : 'btn-outline'}"
                onclick={() => toggleMemberTxSourceFilter('Incentive')}
              >
                <span class="badge badge-xs badge-success mr-1"></span>
                Incentive
              </button>
              <button
                class="btn btn-sm {memberTxSourceFilter.has('Tier') ? 'btn-secondary' : 'btn-outline'}"
                onclick={() => toggleMemberTxSourceFilter('Tier')}
              >
                <span class="badge badge-xs badge-secondary mr-1"></span>
                Tier
              </button>
            </div>
          </div>
          <TimelineTab
            items={filteredMemberTransactions}
            loading={loadingMemberTx}
            {expandedRows}
            processingRefund={null}
            onToggleRow={toggleRow}
            onOpenRefund={() => {}}
          />
        {:else if activeTab === "json"}
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
  {member}
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
