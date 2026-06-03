<script>
  import {
    formatDate,
    formatNum,
  } from "../../../utils/transactionFormatting.js";
  import SectionHeading from "../../shared/SectionHeading.svelte";
  import { calculateTierProgress } from "../../../utils/tierProgress.js";
  import BalanceStats from "../BalanceStats.svelte";
  import LifetimeBreakdown from "../LifetimeBreakdown.svelte";
  import TierProgressCard from "../TierProgressCard.svelte";
  import PointsBucketsTable from "../PointsBucketsTable.svelte";
  import CountBadge from "../../shared/CountBadge.svelte";

  let {
    isMemberMode = false,
    member = null,
    selectedCard,
    selectedMemberCard,
    pendingBuckets = [],
    expiringBuckets = [],
    loadingCardDetail = false,
    processingBucket = null,
    expandedRows = {},
    onActivatePending,
    onCancelPending,
    onExpirePoints,
    onToggleRow,
  } = $props();
</script>

{#if isMemberMode}
  <!-- ── Member overview ──────────────────────────────────────────────────── -->
  <div class="space-y-6">
    <!-- Member details -->
    <div>
      <div class="mb-3">
        <SectionHeading>
          Member Details
        </SectionHeading>
      </div>
      <div
        class="bg-base-200 rounded-xl p-4 grid grid-cols-2 gap-x-8 gap-y-2 text-sm"
      >
        <div class="flex justify-between">
          <span class="text-base-content/60">Status</span>
          <span class="font-semibold">{member?.status ?? "–"}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-base-content/60">Enrolled</span>
          <span class="font-semibold">{formatDate(member?.created_at)}</span>
        </div>
        <div class="flex justify-between col-span-2">
          <span class="text-base-content/60">Customer ID</span>
          <span class="font-mono text-xs">{member?.customer_id ?? "–"}</span>
        </div>
        <div class="flex justify-between col-span-2">
          <span class="text-base-content/60">Member ID</span>
          <span class="font-mono text-xs">{member?.id ?? "–"}</span>
        </div>
      </div>
    </div>

    <!-- Cards summary -->
    {#if member?.cards?.length > 0}
      <div>
        <div class="mb-3">
          <SectionHeading>
            Cards
            <CountBadge count={member.cards.length} className="ml-1 normal-case" />
          </SectionHeading>
        </div>
        <div class="space-y-2">
          {#each member.cards as mc (mc.card.id)}
            {@const card = mc.card}
            {@const tp = mc.tier_progress?.current}
            {@const tpPct = tp
              ? calculateTierProgress(tp.points.current, tp.points.min, tp.points.max)
              : 0}
            <div class="bg-base-200 rounded-xl p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p
                    class="text-[10px] font-semibold uppercase tracking-wide text-base-content/50 mb-0.5"
                  >
                    {card?.card_type || mc.member_role || "Card"}
                  </p>
                  <p class="text-xs font-mono truncate">
                    {card?.code || card?.id || "–"}
                  </p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-lg font-bold text-primary">
                    {formatNum(card?.balance?.points)}
                  </p>
                  <p class="text-[10px] text-base-content/50">pts available</p>
                  {#if card?.balance?.pending_points > 0}
                    <p class="text-[10px] text-warning">
                      {formatNum(card.balance.pending_points)} pending
                    </p>
                  {/if}
                </div>
              </div>
              {#if tp}
                <div class="mt-3 pt-3 border-t border-base-300">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-[10px] font-semibold text-base-content/60"
                      >{tp.name}</span
                    >
                    <span class="text-[10px] text-base-content/40"
                      >{formatNum(tp.points.current)} / {formatNum(
                        tp.points.max,
                      )} pts</span
                    >
                  </div>
                  <div class="h-2 rounded-full bg-base-300 overflow-hidden">
                    <div
                      class="h-full rounded-full bg-primary transition-all"
                      style="width: {Math.max(tpPct, 2)}%"
                    ></div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="alert alert-info text-sm">
        <span>No cards associated with this member</span>
      </div>
    {/if}
  </div>
{:else}
  <!-- ── Card overview ─────────────────────────────────────────────────────── -->
  <div class="space-y-6">
    <!-- Balance stats -->
    <BalanceStats
      balance={selectedCard.balance}
      nextExpiration={selectedCard.next_expiration}
      nextActivation={selectedCard.next_activation}
    />

    <!-- Tier progress, Lifetime, Pending & Expiring Buckets -->
    <TierProgressCard
      tierProgress={selectedMemberCard?.tier_progress}
      memberCard={selectedMemberCard}
    />

    <LifetimeBreakdown lifetimeBucket={selectedCard.lifetime_bucket} />

    <PointsBucketsTable
      type="pending"
      buckets={pendingBuckets}
      loading={loadingCardDetail}
      {processingBucket}
      {expandedRows}
      {onActivatePending}
      {onCancelPending}
      {onToggleRow}
    />

    <PointsBucketsTable
      type="expiring"
      buckets={expiringBuckets}
      loading={loadingCardDetail}
      {processingBucket}
      {expandedRows}
      {onExpirePoints}
      {onToggleRow}
    />
  </div>
{/if}
