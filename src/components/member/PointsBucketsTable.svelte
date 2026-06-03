<script>
  import { formatDate, formatNum } from "../../utils/transactionFormatting.js";
  import ExpandableJsonRow from "../shared/ExpandableJsonRow.svelte";
  import CountBadge from "../shared/CountBadge.svelte";

  let {
    type = 'pending', // 'pending' or 'expiring'
    buckets = [],
    loading = false,
    processingBucket = null,
    expandedRows = {},
    onActivatePending = () => {},
    onCancelPending = () => {},
    onExpirePoints = () => {},
    onToggleRow = () => {},
  } = $props();

  const JSON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>`;

  const title = $derived(type === 'pending' ? 'Pending Points' : 'Expiring Points');
  const emptyMessage = $derived(type === 'pending' ? 'No pending points' : 'No expiring points');
  const colspan = $derived(type === 'pending' ? 6 : 7);
</script>

<div>
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">
    {title}
    {#if buckets.length > 0}
      <CountBadge count={buckets.length} className="ml-1 normal-case" />
    {/if}
  </p>
  {#if loading}
    <div class="flex items-center gap-2 text-base-content/40 text-sm py-2">
      <span class="loading loading-spinner loading-xs"></span>Loading…
    </div>
  {:else if buckets.length === 0}
    <p class="text-sm text-base-content/40">{emptyMessage}</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="table table-zebra table-xs w-full">
        <thead>
          <tr>
            <th>ID</th>
            <th>Points</th>
            <th>Status</th>
            {#if type === 'pending'}
              <th>Activates</th>
            {:else}
              <th>Expires</th>
              <th>Type</th>
            {/if}
            <th>Actions</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each buckets as bucket}
            <tr class="hover:bg-base-200/50">
              <td class="font-mono text-[10px] text-base-content/50">{bucket.id}</td>
              <td class="font-bold">{formatNum(bucket.points?.total)}</td>
              <td>
                <span
                  class="badge badge-xs {
                    bucket.status === 'ACTIVE' ? 'badge-success' :
                    (type === 'pending' && bucket.status === 'CANCELED') || (type === 'expiring' && bucket.status === 'EXPIRED') ? 'badge-error' :
                    type === 'pending' ? 'badge-warning' : 'badge-ghost'
                  }"
                >
                  {bucket.status}
                </span>
              </td>
              {#if type === 'pending'}
                <td class="text-xs {bucket.next_activation ? 'text-info' : 'text-base-content/50'}">
                  {formatDate(bucket.next_activation)}
                </td>
              {:else}
                <td class="text-xs {bucket.expiration_date ? 'text-warning' : 'text-base-content/50'}">
                  {formatDate(bucket.expiration_date)}
                </td>
                <td class="text-xs text-base-content/50">{bucket.expiration_type || "–"}</td>
              {/if}
              <td>
                {#if type === 'pending' && bucket.status === "PENDING"}
                  <div class="flex gap-1">
                    <button
                      class="btn btn-xs btn-success"
                      onclick={() => onActivatePending(bucket.id)}
                      disabled={processingBucket === bucket.id}
                    >
                      {processingBucket === bucket.id ? "…" : "Activate"}
                    </button>
                    <button
                      class="btn btn-xs btn-error btn-outline"
                      onclick={() => onCancelPending(bucket.id)}
                      disabled={processingBucket === bucket.id}
                    >
                      Cancel
                    </button>
                  </div>
                {:else if type === 'expiring' && bucket.status === "ACTIVE"}
                  <button
                    class="btn btn-xs btn-warning btn-outline"
                    onclick={() => onExpirePoints(bucket.id)}
                    disabled={processingBucket === bucket.id}
                  >
                    {processingBucket === bucket.id ? "…" : "Expire now"}
                  </button>
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
            <ExpandableJsonRow
              data={bucket}
              {colspan}
              expanded={expandedRows[bucket.id]}
            />
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
