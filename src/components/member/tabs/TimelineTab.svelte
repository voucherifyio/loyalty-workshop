<script>
  import StatusBadge from '../../StatusBadge.svelte';
  import { getSignedPoints, getTxTypeColor, formatDateTime } from '../../../utils/transactionFormatting.js';

  let {
    items = [],
    loading = false,
    expandedRows = {},
    processingRefund = null,
    onToggleRow,
    onOpenRefund,
  } = $props();

  const JSON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>`;
</script>

<div>
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">
    All Transactions
    {#if items.length > 0}
      <span class="badge badge-xs badge-ghost ml-1 normal-case">{items.length}</span>
    {/if}
  </p>

  {#if loading}
    <div class="flex items-center justify-center py-12"><span class="loading loading-spinner loading-md"></span></div>
  {:else if items.length === 0}
    <div class="alert alert-info text-sm"><span>No transactions found</span></div>
  {:else}
    <div class="overflow-x-auto">
      <table class="table table-zebra table-xs">
        <thead>
          <tr><th>Date</th><th>Source</th><th>Type</th><th>Points</th><th>Status</th><th>ID</th><th>Actions</th><th></th></tr>
        </thead>
        <tbody>
          {#each items as tx}
            {@const sourceColor = tx._source === 'Card' ? 'badge-info' : tx._source === 'Reward' ? 'badge-accent' : tx._source === 'Order' ? 'badge-warning' : 'badge-success'}
            {@const pts = tx._source === 'Card' ? getSignedPoints(tx) : tx._source === 'Reward' ? -(tx.details?.points?.total || 0) : tx._source === 'Order' ? -(tx.details?.payment?.points_spent || 0) : null}
            {@const canRefund = tx._source === 'Reward' && tx.status === 'APPROVED' && tx.type === 'PURCHASE'}
            {@const child = tx._childCardTx}
            {@const childPts = child ? getSignedPoints(child) : null}
            <tr>
              <td class="text-[10px] whitespace-nowrap">{formatDateTime(tx.created_at)}</td>
              <td><span class="badge badge-sm {sourceColor}">{tx._source}</span></td>
              <td>
                {#if tx._source === 'Card'}
                  <span class="badge badge-sm {getTxTypeColor(tx.type)}">{tx.type || '–'}</span>
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
                  {@html JSON_ICON}
                </button>
              </td>
            </tr>
            {#if expandedRows[tx.id]}
              <tr><td colspan="8" class="bg-base-300"><pre class="text-[9px] p-2 overflow-x-auto">{JSON.stringify(tx, null, 2)}</pre></td></tr>
            {/if}
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
                    {@html JSON_ICON}
                  </button>
                </td>
              </tr>
              {#if expandedRows[child.id]}
                <tr><td colspan="8" class="bg-base-300"><pre class="text-[9px] p-2 overflow-x-auto">{JSON.stringify(child, null, 2)}</pre></td></tr>
              {/if}
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
