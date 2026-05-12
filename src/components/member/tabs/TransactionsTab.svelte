<!--
  Reusable transaction table used by Card Transactions, Reward Purchases,
  Order Payments, and Incentive Transactions tabs.
  `kind` controls which columns and actions are shown.
-->
<script>
  import StatusBadge from '../../StatusBadge.svelte';
  import {
    getSignedPoints, getTxTypeColor, getStatusColor,
    formatAmount, formatDateTime
  } from '../../../utils/transactionFormatting.js';

  /** @type {'cardTx' | 'rewards' | 'orders' | 'incentives'} */
  let {
    kind,
    items = [],
    loading = false,
    expandedRows = {},
    processingRefund = null,
    onToggleRow,
    onOpenRefund,
  } = $props();

  const LABELS = {
    cardTx: 'Card Transactions',
    rewards: 'Reward Purchases',
    orders: 'Order Payments (Pay With Points)',
    incentives: 'Incentive Transactions',
  };

  const JSON_ICON = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3"><path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>`;
</script>

<div>
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">{LABELS[kind]}</p>

  {#if loading}
    <div class="flex items-center justify-center py-12"><span class="loading loading-spinner loading-md"></span></div>
  {:else if items.length === 0}
    <div class="alert alert-info text-sm"><span>No {LABELS[kind].toLowerCase()} found</span></div>
  {:else}
    <div class="overflow-x-auto">

      {#if kind === 'cardTx'}
        <table class="table table-zebra table-xs">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Points</th><th>Status</th><th>Reason</th><th>ID</th><th></th></tr>
          </thead>
          <tbody>
            {#each items as tx}
              {@const pts = getSignedPoints(tx)}
              <tr>
                <td class="text-[10px] whitespace-nowrap">{formatDateTime(tx.created_at)}</td>
                <td><span class="badge badge-sm {getTxTypeColor(tx.type)}">{tx.type}</span></td>
                <td class="font-mono font-bold" class:text-success={pts > 0} class:text-error={pts < 0}>{pts > 0 ? '+' : ''}{pts !== 0 ? pts : '–'}</td>
                <td>{#if tx.status}<StatusBadge status={tx.status} />{:else}–{/if}</td>
                <td class="text-[10px] max-w-xs truncate">{tx.details?.reason || '–'}</td>
                <td class="font-mono text-[9px] text-base-content/50">{tx.id}</td>
                <td>
                  <button class="btn btn-circle btn-xs btn-ghost" onclick={() => onToggleRow(tx.id)} title="JSON">
                    {@html JSON_ICON}
                  </button>
                </td>
              </tr>
              {#if expandedRows[tx.id]}
                <tr><td colspan="7" class="bg-base-300"><pre class="text-[9px] p-2 overflow-x-auto">{JSON.stringify(tx, null, 2)}</pre></td></tr>
              {/if}
            {/each}
          </tbody>
        </table>

      {:else if kind === 'rewards'}
        <table class="table table-zebra table-xs">
          <thead>
            <tr><th>Date</th><th>Reward</th><th>Type</th><th>Points</th><th>Qty</th><th>Status</th><th>ID</th><th>Actions</th><th></th></tr>
          </thead>
          <tbody>
            {#each items as p}
              {@const result = p.details?.result}
              {@const pts = p.details?.points?.total || 0}
              {@const rewardType = result?.reward?.type}
              {@const digitalType = result?.digital?.type}
              {@const qty = result?.quantity ?? '—'}
              {@const canRefund = p.status === 'APPROVED' && p.type === 'PURCHASE'}
              <tr>
                <td class="text-[10px] whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                <td class="font-mono text-[10px] text-base-content/60">{p.reward_id}</td>
                <td class="text-[10px]">
                  {#if rewardType}<span class="badge badge-sm badge-neutral font-mono text-[9px]">{rewardType}</span>{/if}
                  {#if digitalType}<span class="badge badge-sm badge-outline font-mono text-[9px] ml-0.5">{digitalType}</span>{/if}
                  {#if !rewardType}–{/if}
                </td>
                <td class="font-mono font-bold text-error">{pts ? `-${pts}` : '–'}</td>
                <td class="font-mono text-[10px]">{qty}</td>
                <td><span class="badge badge-sm {getStatusColor(p.status)}">{p.status}</span></td>
                <td class="font-mono text-[9px] text-base-content/50">{p.id}</td>
                <td>
                  {#if canRefund}
                    <button
                      class="btn btn-xs btn-warning btn-outline"
                      onclick={() => onOpenRefund(p.id)}
                      disabled={processingRefund === p.id}
                    >{processingRefund === p.id ? '…' : 'Refund'}</button>
                  {/if}
                </td>
                <td>
                  <button class="btn btn-circle btn-xs btn-ghost" onclick={() => onToggleRow(p.id)} title="JSON">
                    {@html JSON_ICON}
                  </button>
                </td>
              </tr>
              {#if expandedRows[p.id]}
                <tr><td colspan="9" class="bg-base-300"><pre class="text-[9px] p-2 overflow-x-auto">{JSON.stringify(p, null, 2)}</pre></td></tr>
              {/if}
            {/each}
          </tbody>
        </table>

      {:else if kind === 'orders'}
        <table class="table table-zebra table-xs">
          <thead>
            <tr><th>Date</th><th>Type</th><th>Order ID</th><th>Points Spent</th><th>Amount</th><th>Ratio</th><th>Status</th><th>ID</th><th></th></tr>
          </thead>
          <tbody>
            {#each items as p}
              {@const pts = p.details?.payment?.points_spent || 0}
              {@const amt = p.details?.payment?.amount}
              {@const ratio = p.details?.payment?.exchange_ratio}
              <tr>
                <td class="text-[10px] whitespace-nowrap">{formatDateTime(p.created_at)}</td>
                <td><span class="badge badge-sm badge-neutral font-mono text-[9px]">{p.type || 'N/A'}</span></td>
                <td class="font-mono text-[10px] text-base-content/60">{p.order_id || '–'}</td>
                <td class="font-mono font-bold text-error">-{pts}</td>
                <td class="font-mono text-[10px]">{formatAmount(amt)}</td>
                <td class="font-mono text-[10px]">{ratio != null ? ratio : 'N/A'}</td>
                <td><span class="badge badge-sm {getStatusColor(p.status)}">{p.status}</span></td>
                <td class="font-mono text-[9px] text-base-content/50">{p.id}</td>
                <td>
                  <button class="btn btn-circle btn-xs btn-ghost" onclick={() => onToggleRow(p.id)} title="JSON">
                    {@html JSON_ICON}
                  </button>
                </td>
              </tr>
              {#if expandedRows[p.id]}
                <tr><td colspan="9" class="bg-base-300"><pre class="text-[9px] p-2 overflow-x-auto">{JSON.stringify(p, null, 2)}</pre></td></tr>
              {/if}
            {/each}
          </tbody>
        </table>

      {:else if kind === 'incentives'}
        <table class="table table-zebra table-xs">
          <thead>
            <tr><th>Date</th><th>Incentive</th><th>Earning Rule</th><th>Type</th><th>Status</th><th>ID</th><th></th></tr>
          </thead>
          <tbody>
            {#each items as tx}
              <tr>
                <td class="text-[10px] whitespace-nowrap">{formatDateTime(tx.created_at)}</td>
                <td class="font-mono text-[10px] text-base-content/60">{tx.incentive_id || '–'}</td>
                <td class="font-mono text-[10px] text-base-content/60">{tx.earning_rule_id || '–'}</td>
                <td><span class="badge badge-sm badge-neutral font-mono text-[9px]">{tx.type || '–'}</span></td>
                <td>{#if tx.status}<StatusBadge status={tx.status} />{:else}–{/if}</td>
                <td class="font-mono text-[9px] text-base-content/50">{tx.id}</td>
                <td>
                  <button class="btn btn-circle btn-xs btn-ghost" onclick={() => onToggleRow(tx.id)} title="JSON">
                    {@html JSON_ICON}
                  </button>
                </td>
              </tr>
              {#if expandedRows[tx.id]}
                <tr><td colspan="7" class="bg-base-300"><pre class="text-[9px] p-2 overflow-x-auto">{JSON.stringify(tx, null, 2)}</pre></td></tr>
              {/if}
            {/each}
          </tbody>
        </table>
      {/if}

    </div>
  {/if}
</div>
