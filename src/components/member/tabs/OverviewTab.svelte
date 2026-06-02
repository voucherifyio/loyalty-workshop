<script>
  import {
    formatDate,
    formatNum,
  } from "../../../utils/transactionFormatting.js";

  let {
    isMemberMode = false,
    member = null,
    programId = null,
    memberId = null,
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

  const JSON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>`;
</script>

{#if isMemberMode}
  <!-- ── Member overview ──────────────────────────────────────────────────── -->
  <div class="space-y-6">
    <!-- Member details -->
    <div>
      <p
        class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3"
      >
        Member Details
      </p>
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
        <p
          class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3"
        >
          Cards
          <span class="badge badge-xs badge-ghost ml-1 normal-case"
            >{member.cards.length}</span
          >
        </p>
        <div class="space-y-2">
          {#each member.cards as mc}
            {@const card = mc.card}
            {@const tp = mc.tier_progress?.current}
            {@const tpPct = tp
              ? Math.min(
                  100,
                  Math.round(
                    ((tp.points.current - tp.points.min) /
                      Math.max(tp.points.max - tp.points.min, 1)) *
                      100,
                  ),
                )
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
    <div>
      <p
        class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3"
      >
        Balance
      </p>
      <div class="grid grid-cols-2 gap-3">
        <!-- Available points + next expiration -->
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-3xl font-bold text-primary">
            {formatNum(selectedCard.balance?.points)}
          </p>
          <p class="text-xs text-base-content/50 mt-1">Available Points</p>
          {#if selectedCard.next_expiration}
            <div class="mt-3 pt-3 border-t border-base-300">
              <p
                class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wide mb-1"
              >
                Next Expiration
              </p>
              <p class="text-sm font-bold text-warning">
                {formatDate(selectedCard.next_expiration.date)}
              </p>
              <p class="text-xs text-base-content/50">
                {formatNum(selectedCard.next_expiration.points)} pts expiring
              </p>
            </div>
          {/if}
        </div>

        <!-- Pending points + next activation -->
        <div class="bg-base-200 rounded-xl p-4">
          <p class="text-3xl font-bold text-warning">
            {formatNum(selectedCard.balance?.pending_points)}
          </p>
          <p class="text-xs text-base-content/50 mt-1">Pending Points</p>
          {#if selectedCard.next_activation}
            <div class="mt-3 pt-3 border-t border-base-300">
              <p
                class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wide mb-1"
              >
                Next Activation
              </p>
              <p class="text-sm font-bold text-info">
                {formatDate(selectedCard.next_activation.date)}
              </p>
              <p class="text-xs text-base-content/50">
                {formatNum(selectedCard.next_activation.points)} pts activating
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Tier progress -->
    {#if selectedMemberCard?.tier_progress?.current}
      {@const tp = selectedMemberCard.tier_progress.current}
      {@const tsId = selectedMemberCard.tier_progress.tier_structure?.id}
      {@const opportunities =
        selectedMemberCard.tier_progress.opportunities ?? []}
      {@const risks = selectedMemberCard.tier_progress.risks ?? []}
      {@const range = Math.max(tp.points.max - tp.points.min, 1)}
      {@const pct = Math.min(
        100,
        Math.round(((tp.points.current - tp.points.min) / range) * 100),
      )}
      {@const tierStart = selectedMemberCard?.created_at
        ? new Date(selectedMemberCard.created_at).getTime()
        : null}
      {@const tierEnd = tp.expires_at
        ? new Date(tp.expires_at).getTime()
        : null}
      {@const tierNow = Date.now()}
      {@const tierTimePct =
        tierStart && tierEnd
          ? Math.min(
              Math.max((tierNow - tierStart) / (tierEnd - tierStart), 0),
              1,
            )
          : null}
      {@const fmtTierDate = (d) =>
        new Date(d).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      <div>
        <p
          class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3"
        >
          Tier Progress
        </p>
        <div class="bg-base-200 rounded-xl p-3">
          <div class="grid grid-cols-3 gap-4">
            <!-- Left: Risks -->
            <div class="space-y-2">
              <p
                class="text-[10px] font-semibold text-base-content/40 uppercase"
              >
                Risks
                {#if risks.length > 0}
                  <span class="badge badge-xs">{risks.length}</span>
                {/if}
              </p>
              {#if risks.length === 0}
                <div class="text-center py-4">
                  <p class="text-xs text-base-content/40">No risks</p>
                </div>
              {:else}
                <div class="space-y-1.5">
                  {#each risks.slice(0, 3) as risk}
                    {#if risk.type === 'TIER_DOWNGRADE'}
                      <div class="bg-error/10 border border-error/30 rounded p-2">
                        <div class="flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-error shrink-0 mt-0.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                          </svg>
                          <div class="flex-1 min-w-0">
                            <p class="text-xs font-semibold text-error">Tier at Risk</p>
                            <p class="text-[9px] text-base-content/60 mt-0.5">
                              Downgrades {formatDate(risk.date)}
                            </p>
                            {#if risk.tier_id}
                              <p class="text-[9px] text-base-content/50 font-mono truncate mt-0.5">
                                → {risk.tier_id}
                              </p>
                            {/if}
                            {#if opportunities.length > 0}
                              <p class="text-[9px] text-warning font-semibold mt-1.5">
                                Take action to maintain tier
                              </p>
                            {/if}
                          </div>
                        </div>
                      </div>
                    {:else}
                      <div class="bg-warning/10 border border-warning/30 rounded p-2">
                        <p class="text-xs font-semibold text-warning">{risk.type || 'Risk'}</p>
                        <p class="text-[9px] text-base-content/50">
                          {risk.description || ''}
                        </p>
                      </div>
                    {/if}
                  {/each}
                  {#if risks.length > 3}
                    <p class="text-[9px] text-base-content/40 text-center">
                      +{risks.length - 3} more
                    </p>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Center: Progress -->
            <div class="space-y-2">
              <div class="text-center">
                <p class="text-sm font-bold">{tp.name}</p>
                <p class="text-[9px] text-base-content/40">Current Tier</p>
                {#if tsId}
                  <p class="text-[9px] font-mono text-base-content/40 mt-0.5">
                    {tsId}
                  </p>
                {/if}
              </div>
              <div class="h-4 rounded-lg bg-base-300 overflow-hidden">
                <div
                  class="h-full rounded-lg bg-primary transition-all flex items-center justify-end pr-2"
                  style="width: {Math.max(pct, 4)}%"
                >
                  {#if pct >= 20}
                    <span class="text-[8px] font-bold text-primary-content"
                      >{pct}%</span
                    >
                  {/if}
                </div>
              </div>
              <div class="text-center">
                <p class="text-xs font-semibold">{pct}%</p>
                <p class="text-[9px] text-base-content/40">
                  {formatNum(tp.points.current)} / {formatNum(tp.points.max)} pts
                </p>
                {#if tp.expires_at}
                  <p class="text-[9px] text-base-content/40 mt-1">
                    Expires: {fmtTierDate(tp.expires_at)}
                  </p>
                {/if}
              </div>
            </div>

            <!-- Right: Opportunities -->
            <div class="space-y-2">
              <p
                class="text-[10px] font-semibold text-base-content/40 uppercase"
              >
                Opportunities
                {#if opportunities.length > 0}
                  <span class="badge badge-xs">{opportunities.length}</span>
                {/if}
              </p>
              {#if opportunities.length === 0}
                <div class="text-center py-4">
                  <p class="text-xs text-base-content/40">No opportunities</p>
                </div>
              {:else}
                <div class="space-y-1.5">
                  {#each opportunities.slice(0, 3) as opp}
                    <div class="bg-base-300/30 rounded p-2">
                      <p class="text-xs font-semibold">{opp.tier_id}</p>
                      {#if opp.points === 0}
                        <p class="text-[9px] text-success">Eligible now</p>
                      {:else}
                        <p class="text-[9px] text-base-content/50">
                          +{formatNum(opp.points)} pts needed
                        </p>
                      {/if}
                    </div>
                  {/each}
                  {#if opportunities.length > 3}
                    <p class="text-[9px] text-base-content/40 text-center">
                      +{opportunities.length - 3} more
                    </p>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Lifetime breakdown -->
    {#if selectedCard.lifetime_bucket}
      {@const lb = selectedCard.lifetime_bucket}
      <div>
        <p
          class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3"
        >
          Lifetime Breakdown
        </p>
        <div class="bg-base-200/50 rounded-xl p-4">
          <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {#if lb.points}
              <div class="flex justify-between">
                <span class="text-base-content/60">Total earned</span><span
                  class="font-semibold">{formatNum(lb.points.earned)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Spent</span><span
                  class="font-semibold">{formatNum(lb.points.spent)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Expired</span><span
                  class="font-semibold text-error/80"
                  >{formatNum(lb.points.expired)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Added (manual)</span><span
                  class="font-semibold">{formatNum(lb.points.added)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Subtracted</span><span
                  class="font-semibold">{formatNum(lb.points.subtracted)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Refunded</span><span
                  class="font-semibold">{formatNum(lb.points.refunded)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Returned</span><span
                  class="font-semibold">{formatNum(lb.points.returned)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Locked</span><span
                  class="font-semibold text-warning/80"
                  >{formatNum(lb.points.locked)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Unlocked</span><span
                  class="font-semibold">{formatNum(lb.points.unlocked)}</span
                >
              </div>
            {/if}
            {#if lb.pending_points}
              <div class="col-span-2 border-t border-base-300 my-1"></div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Pending total</span><span
                  class="font-semibold text-warning"
                  >{formatNum(lb.pending_points.total)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Pending activated</span><span
                  class="font-semibold"
                  >{formatNum(lb.pending_points.activated)}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Pending canceled</span><span
                  class="font-semibold text-error/80"
                  >{formatNum(lb.pending_points.canceled)}</span
                >
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Pending points buckets -->
    <div>
      <p
        class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3"
      >
        Pending Points {#if pendingBuckets.length > 0}<span
            class="badge badge-xs badge-ghost ml-1 normal-case"
            >{pendingBuckets.length}</span
          >{/if}
      </p>
      {#if loadingCardDetail}
        <div class="flex items-center gap-2 text-base-content/40 text-sm py-2">
          <span class="loading loading-spinner loading-xs"></span>Loading…
        </div>
      {:else if pendingBuckets.length === 0}
        <p class="text-sm text-base-content/40">No pending points</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="table table-xs w-full">
            <thead
              ><tr
                ><th>ID</th><th>Points</th><th>Status</th><th>Activates</th><th
                  >Actions</th
                ><th></th></tr
              ></thead
            >
            <tbody>
              {#each pendingBuckets as bucket}
                <tr class="hover:bg-base-200/50">
                  <td class="font-mono text-[10px] text-base-content/50"
                    >{bucket.id}</td
                  >
                  <td class="font-bold">{formatNum(bucket.points?.total)}</td>
                  <td
                    ><span
                      class="badge badge-xs {bucket.status === 'ACTIVE'
                        ? 'badge-success'
                        : bucket.status === 'CANCELED'
                          ? 'badge-error'
                          : 'badge-warning'}">{bucket.status}</span
                    ></td
                  >
                  <td
                    class="text-xs {bucket.next_activation
                      ? 'text-info'
                      : 'text-base-content/50'}"
                    >{formatDate(bucket.next_activation)}</td
                  >
                  <td>
                    {#if bucket.status === "PENDING"}
                      <div class="flex gap-1">
                        <button
                          class="btn btn-xs btn-success"
                          onclick={() => onActivatePending(bucket.id)}
                          disabled={processingBucket === bucket.id}
                          >{processingBucket === bucket.id
                            ? "…"
                            : "Activate"}</button
                        >
                        <button
                          class="btn btn-xs btn-error btn-outline"
                          onclick={() => onCancelPending(bucket.id)}
                          disabled={processingBucket === bucket.id}
                          >Cancel</button
                        >
                      </div>
                    {/if}
                  </td>
                  <td>
                    <button
                      class="btn btn-circle btn-xs btn-ghost"
                      onclick={() => onToggleRow(bucket.id)}
                      title="Toggle JSON"
                    >
                      {@html JSON_ICON}
                    </button>
                  </td>
                </tr>
                {#if expandedRows[bucket.id]}
                  <tr
                    ><td colspan="6" class="bg-base-300"
                      ><pre
                        class="text-[9px] p-2 overflow-x-auto">{JSON.stringify(
                          bucket,
                          null,
                          2,
                        )}</pre></td
                    ></tr
                  >
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

    <!-- Expiring points buckets -->
    <div>
      <p
        class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3"
      >
        Expiring Points {#if expiringBuckets.length > 0}<span
            class="badge badge-xs badge-ghost ml-1 normal-case"
            >{expiringBuckets.length}</span
          >{/if}
      </p>
      {#if loadingCardDetail}
        <div class="flex items-center gap-2 text-base-content/40 text-sm py-2">
          <span class="loading loading-spinner loading-xs"></span>Loading…
        </div>
      {:else if expiringBuckets.length === 0}
        <p class="text-sm text-base-content/40">No expiring points</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="table table-xs w-full">
            <thead
              ><tr
                ><th>ID</th><th>Points</th><th>Status</th><th>Expires</th><th
                  >Type</th
                ><th>Actions</th><th></th></tr
              ></thead
            >
            <tbody>
              {#each expiringBuckets as bucket}
                <tr class="hover:bg-base-200/50">
                  <td class="font-mono text-[10px] text-base-content/50"
                    >{bucket.id}</td
                  >
                  <td class="font-bold">{formatNum(bucket.points?.total)}</td>
                  <td
                    ><span
                      class="badge badge-xs {bucket.status === 'ACTIVE'
                        ? 'badge-success'
                        : bucket.status === 'EXPIRED'
                          ? 'badge-error'
                          : 'badge-ghost'}">{bucket.status}</span
                    ></td
                  >
                  <td
                    class="text-xs {bucket.expiration_date
                      ? 'text-warning'
                      : 'text-base-content/50'}"
                    >{formatDate(bucket.expiration_date)}</td
                  >
                  <td class="text-xs text-base-content/50"
                    >{bucket.expiration_type || "–"}</td
                  >
                  <td>
                    {#if bucket.status === "ACTIVE"}
                      <button
                        class="btn btn-xs btn-warning btn-outline"
                        onclick={() => onExpirePoints(bucket.id)}
                        disabled={processingBucket === bucket.id}
                        >{processingBucket === bucket.id
                          ? "…"
                          : "Expire now"}</button
                      >
                    {/if}
                  </td>
                  <td>
                    <button
                      class="btn btn-circle btn-xs btn-ghost"
                      onclick={() => onToggleRow(bucket.id)}
                      title="Toggle JSON"
                    >
                      {@html JSON_ICON}
                    </button>
                  </td>
                </tr>
                {#if expandedRows[bucket.id]}
                  <tr
                    ><td colspan="7" class="bg-base-300"
                      ><pre
                        class="text-[9px] p-2 overflow-x-auto">{JSON.stringify(
                          bucket,
                          null,
                          2,
                        )}</pre></td
                    ></tr
                  >
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
{/if}
