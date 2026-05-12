<script>
  import StatusBadge from '../StatusBadge.svelte';
  import CopyId from '../CopyId.svelte';
  import { formatDate } from '../../utils/transactionFormatting.js';

  let {
    member = null,
    loadingMember = false,
    refreshing = false,
    onRefresh,
    onClose,
  } = $props();
</script>

<div class="flex items-center gap-4 px-6 py-4 border-b border-base-300 shrink-0">
  <div class="flex-1 min-w-0">
    <p class="text-xs text-base-content/50 font-medium uppercase tracking-wide mb-0.5">Member</p>
    {#if member}
      <div class="flex items-center gap-2 flex-wrap">
        <StatusBadge status={member.status} />
        <CopyId id={member.id} />
        <span class="text-base-content/30 text-xs">·</span>
        <span class="text-sm font-mono text-base-content/70">{member.customer_id}</span>
        <span class="text-base-content/30 text-xs">·</span>
        <span class="text-xs text-base-content/40">Enrolled {formatDate(member.created_at)}</span>
      </div>
    {:else if loadingMember}
      <div class="h-5 w-48 bg-base-300 rounded animate-pulse"></div>
    {/if}
  </div>
  <button
    class="btn btn-sm btn-circle btn-ghost shrink-0"
    onclick={onRefresh}
    disabled={refreshing || loadingMember}
    aria-label="Refresh"
    title="Refresh member data"
  >
    {#if refreshing}
      <span class="loading loading-spinner loading-xs"></span>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    {/if}
  </button>
  <button
    class="btn btn-sm btn-circle btn-ghost shrink-0"
    onclick={onClose}
    aria-label="Close"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>
