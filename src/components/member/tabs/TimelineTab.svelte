<script>
  import StatusBadge from '../../StatusBadge.svelte';
  import SectionHeading from '../../shared/SectionHeading.svelte';
  import ExpandableJsonRow from '../../shared/ExpandableJsonRow.svelte';
  import LoadingState from '../../shared/LoadingState.svelte';
  import EmptyState from '../../shared/EmptyState.svelte';
  import CountBadge from '../../shared/CountBadge.svelte';
  import { getSignedPoints, getTxTypeColor, getTierTxTypeColor, formatDateTime } from '../../../utils/transactionFormatting.js';

  let {
    items = [],
    loading = false,
    expandedRows = {},
    processingRefund = null,
    onToggleRow,
    onOpenRefund,
  } = $props();
</script>

<div>
  <div class="mb-3">
    <SectionHeading>
      All Transactions
      {#if items.length > 0}
        <CountBadge count={items.length} className="ml-1 normal-case" />
      {/if}
    </SectionHeading>
  </div>

  {#if loading}
    <LoadingState />
  {:else if items.length === 0}
    <EmptyState message="No transactions found" />
  {:else}
    <div class="overflow-x-auto">
      <table class="table table-zebra table-xs">
        <thead>
          <tr><th>Date</th><th>Source</th><th>Type</th><th>Points</th><th>Status</th><th>ID</th><th>Actions</th><th></th></tr>
        </thead>
        <tbody>
          {#each items as tx (tx.id)}
            {@const sourceColor = tx._source === 'Card' ? 'badge-info' : tx._source === 'Reward' ? 'badge-accent' : tx._source === 'Order' ? 'badge-warning' : tx._source === 'Tier' ? 'badge-secondary' : 'badge-success'}
            {@const pts = tx._source === 'Card' ? getSignedPoints(tx) : tx._source === 'Reward' ? -(tx.details?.points?.total || 0) : tx._source === 'Order' ? -(tx.details?.payment?.points_spent || 0) : tx._source === 'Tier' ? tx.details?.points : null}
            {@const canRefund = tx._source === 'Reward' && tx.status === 'APPROVED' && tx.type === 'PURCHASE'}
            {@const child = tx._childCardTx}
            {@const childPts = child ? getSignedPoints(child) : null}
            <tr>
              <td class="text-[10px] whitespace-nowrap">{formatDateTime(tx.created_at)}</td>
              <td><span class="badge badge-sm {sourceColor}">{tx._source}</span></td>
              <td>
                {#if tx._source === 'Card'}
                  <span class="badge badge-sm {getTxTypeColor(tx.type)}">{tx.type || '–'}</span>
                {:else if tx._source === 'Tier'}
                  <span class="badge badge-sm {getTierTxTypeColor(tx.type)}">{tx.type || '–'}</span>
                {:else}
                  <span class="badge badge-sm badge-neutral font-mono text-[9px]">{tx.type || '–'}</span>
                {/if}
              </td>
              <td class="font-mono font-bold"
                class:text-success={pts != null && pts > 0}
                class:text-error={pts != null && pts < 0}
              >
                {#if pts != null && pts !== 0}{pts > 0 ? '+' : ''}{pts}{:else}–{/if}
              </td>
              <td>
                {#if tx.status}<StatusBadge status={tx.status} />{:else}–{/if}
              </td>
              <td class="font-mono text-[9px] text-base-content/50">{tx.id}</td>
              <td>
                {#if canRefund}
                  <button
                    class="btn btn-xs btn-warning btn-outline"
                    onclick={() => onOpenRefund(tx.id)}
                    disabled={processingRefund === tx.id}
                  >{processingRefund === tx.id ? '…' : 'Refund'}</button>
                {/if}
              </td>
              <td>
                <button class="btn btn-circle btn-xs btn-ghost" onclick={() => onToggleRow(tx.id)} title="JSON">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                </button>
              </td>
            </tr>
            <ExpandableJsonRow data={tx} colspan={8} expanded={expandedRows[tx.id]} />
            {#if child}
              <tr class="bg-base-200/40 border-l-2 border-primary/20">
                <td class="text-[10px] whitespace-nowrap pl-6 text-base-content/40">
                  <span class="mr-1 text-base-content/30">└</span>{formatDateTime(child.created_at)}
                </td>
                <td><span class="badge badge-xs badge-ghost">Card</span></td>
                <td><span class="badge badge-xs {getTxTypeColor(child.type)}">{child.type || '–'}</span></td>
                <td class="font-mono text-xs"
                  class:text-success={childPts != null && childPts > 0}
                  class:text-error={childPts != null && childPts < 0}
                >
                  {#if childPts != null && childPts !== 0}{childPts > 0 ? '+' : ''}{childPts}{:else}–{/if}
                </td>
                <td>{#if child.status}<StatusBadge status={child.status} />{:else}–{/if}</td>
                <td class="font-mono text-[9px] text-base-content/40">{child.id}</td>
                <td></td>
                <td>
                  <button class="btn btn-circle btn-xs btn-ghost opacity-50" onclick={() => onToggleRow(child.id)} title="JSON">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  </button>
                </td>
              </tr>
                <ExpandableJsonRow data={child} colspan={8} expanded={expandedRows[child.id]} />
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
