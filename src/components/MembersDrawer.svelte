<script>
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { toast } from "../services/toast.js";
  import StatusBadge from "./StatusBadge.svelte";
  import CopyId from "./CopyId.svelte";
  import MemberDetailModal from "./MemberDetailModal.svelte";

  let {
    open = false,
    programId = null,
    programName = '',
    onClose = () => {},
    onMemberCountChange = null,
  } = $props();

  // Member list state
  let members = $state([]);
  let loading = $state(false);
  let loadingMore = $state(false);
  let cursor = $state(null);
  let hasMore = $state(false);

  // Add member form state
  let newCustomerId = $state('');
  let enrolling = $state(false);
  let enrollError = $state('');

  // Per-member action state
  let confirmingDelete = $state(null);  // memberId
  let deletingMember = $state(null);    // memberId
  let togglingStatus = $state(null);    // memberId

  // Member detail modal
  let selectedMemberId = $state(null);

  function handleKeydown(e) {
    if (e.key === 'Escape' && open) onClose();
  }

  // Fetch first page of members whenever drawer opens or programId changes
  $effect(() => {
    if (open && programId) {
      fetchMembers();
    } else if (!open) {
      resetState();
    }
  });

  function resetState() {
    members = [];
    cursor = null;
    hasMore = false;
    loading = false;
    loadingMore = false;
    newCustomerId = '';
    enrollError = '';
    confirmingDelete = null;
    deletingMember = null;
    togglingStatus = null;
  }

  async function fetchMembers() {
    loading = true;
    try {
      const res = await api.get(endpoints.members.list(programId, { limit: 20 }));
      members = res.data || [];
      cursor = res.cursor?.next ?? null;
      hasMore = !!cursor;
    } catch {
      toast.error('Failed to fetch members');
    } finally {
      loading = false;
    }
  }

  async function loadMore() {
    if (!cursor || loadingMore) return;
    loadingMore = true;
    try {
      const res = await api.get(endpoints.members.list(programId, { limit: 20, cursor }));
      members = [...members, ...(res.data || [])];
      cursor = res.cursor?.next ?? null;
      hasMore = !!cursor;
    } catch {
      toast.error('Failed to load more members');
    } finally {
      loadingMore = false;
    }
  }

  async function enrollMember() {
    const customerId = newCustomerId.trim();
    if (!customerId) return;
    enrollError = '';
    enrolling = true;
    try {
      const member = await api.post(endpoints.members.create(programId), { customer_id: customerId });
      members = [member, ...members];
      newCustomerId = '';
      onMemberCountChange?.();
    } catch (err) {
      enrollError = err?.details || err?.message || 'Enrollment failed';
    } finally {
      enrolling = false;
    }
  }

  async function toggleStatus(member) {
    togglingStatus = member.id;
    try {
      const endpoint = member.status === 'ACTIVE'
        ? endpoints.members.deactivate(programId, member.id)
        : endpoints.members.activate(programId, member.id);
      const updated = await api.post(endpoint, {});
      members = members.map(m => m.id === member.id ? { ...m, ...updated } : m);
    } catch {
      toast.error('Failed to toggle member status');
    } finally {
      togglingStatus = null;
    }
  }

  async function deleteMember(memberId) {
    deletingMember = memberId;
    try {
      await api.delete(endpoints.members.delete(programId, memberId));
      members = members.filter(m => m.id !== memberId);
      confirmingDelete = null;
      onMemberCountChange?.();
    } catch {
      toast.error('Failed to delete member');
    } finally {
      deletingMember = null;
    }
  }

  function formatDate(iso) {
    if (!iso) return '–';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
{#if open}
  <div
    class="fixed inset-0 bg-black/20 z-40"
    onclick={onClose}
    role="presentation"
  ></div>
{/if}

<!-- Drawer Panel -->
<div
  class="fixed top-0 right-0 h-full w-[550px] bg-base-100 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out {open
    ? 'translate-x-0'
    : 'translate-x-full'} flex flex-col"
>
  <!-- Header -->
  <div class="flex items-start justify-between p-4 border-b border-base-300 shrink-0">
    <div class="flex-1 min-w-0 pr-2">
      <p class="text-xs text-base-content/50 font-medium uppercase tracking-wide mb-1">Members</p>
      <h3 class="font-bold text-lg leading-tight truncate">{programName || programId}</h3>
      <p class="text-xs text-base-content/40 mt-0.5">{members.length}{hasMore ? '+' : ''} member{members.length !== 1 ? 's' : ''} loaded</p>
    </div>
    <button
      class="btn btn-sm btn-circle btn-ghost"
      onclick={onClose}
      aria-label="Close drawer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  <!-- Enroll form -->
  <div class="px-4 py-3 border-b border-base-300 shrink-0 bg-base-200/40">
    <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">Enroll New Member</p>
    <div class="flex gap-2 items-center">
      <input
        type="text"
        class="input input-sm input-bordered flex-1 font-mono text-xs"
        placeholder="customer_id"
        bind:value={newCustomerId}
        onkeydown={(e) => e.key === 'Enter' && enrollMember()}
        disabled={enrolling}
      />
      <button
        class="btn btn-sm btn-primary shrink-0"
        onclick={enrollMember}
        disabled={enrolling || !newCustomerId.trim()}
      >
        {#if enrolling}
          <span class="loading loading-spinner loading-xs"></span>
          Enrolling…
        {:else}
          Enroll
        {/if}
      </button>
    </div>
    {#if enrollError}
      <p class="text-xs text-error mt-1.5">{enrollError}</p>
    {/if}
  </div>

  <!-- Member list -->
  <div class="flex-1 overflow-y-auto">
    {#if loading}
      <div class="flex items-center justify-center py-16">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    {:else if members.length === 0}
      <div class="flex flex-col items-center justify-center py-16 text-center px-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor" class="w-12 h-12 text-base-content/20 mb-3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        <p class="text-sm text-base-content/50 font-medium">No members yet</p>
        <p class="text-xs text-base-content/30 mt-1">Use the form above to enroll the first member</p>
      </div>
    {:else}
      <div class="divide-y divide-base-200">
        {#each members as member}
          <div class="px-4 py-3 hover:bg-base-200/40 transition-colors relative">
            {#if confirmingDelete === member.id}
              <!-- Delete confirmation overlay -->
              <div class="absolute inset-0 bg-base-100/95 flex items-center gap-3 px-4 z-10">
                <span class="text-sm text-base-content/70 flex-1">Delete this member permanently?</span>
                <button
                  class="btn btn-xs btn-ghost"
                  onclick={() => confirmingDelete = null}
                  disabled={!!deletingMember}
                >
                  Cancel
                </button>
                <button
                  class="btn btn-xs btn-error"
                  onclick={() => deleteMember(member.id)}
                  disabled={!!deletingMember}
                >
                  {deletingMember === member.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            {/if}

            <div
              class="flex items-center gap-3 cursor-pointer"
              role="button"
              tabindex="0"
              onclick={() => selectedMemberId = member.id}
              onkeydown={(e) => e.key === 'Enter' && (selectedMemberId = member.id)}
            >
              <!-- Avatar placeholder -->
              <div class="w-8 h-8 rounded-full bg-base-300 flex items-center justify-center shrink-0 text-xs font-bold text-base-content/40">
                {member.customer_id?.slice(0, 2)?.toUpperCase() || '?'}
              </div>

              <!-- Member info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <StatusBadge status={member.status} />
                  <CopyId id={member.id} />
                </div>
                <p class="text-xs font-mono text-base-content/70 truncate">{member.customer_id}</p>
                <p class="text-[10px] text-base-content/40 mt-0.5">Enrolled {formatDate(member.created_at)}</p>
              </div>

              <!-- Action buttons -->
              <div class="flex items-center gap-1 shrink-0">
                {#if member.status === 'ACTIVE'}
                  <button
                    class="btn btn-xs btn-circle btn-error tooltip tooltip-bottom"
                    data-tip="Deactivate"
                    aria-label="Deactivate"
                    onclick={(e) => { e.stopPropagation(); toggleStatus(member); }}
                    disabled={togglingStatus === member.id}
                  >
                    {#if togglingStatus === member.id}
                      <span class="loading loading-spinner loading-xs"></span>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                      </svg>
                    {/if}
                  </button>
                {:else if member.status === 'INACTIVE'}
                  <button
                    class="btn btn-xs btn-circle btn-success tooltip tooltip-bottom"
                    data-tip="Activate"
                    aria-label="Activate"
                    onclick={(e) => { e.stopPropagation(); toggleStatus(member); }}
                    disabled={togglingStatus === member.id}
                  >
                    {#if togglingStatus === member.id}
                      <span class="loading loading-spinner loading-xs"></span>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                    {/if}
                  </button>
                {/if}
                <button
                  class="btn btn-xs btn-circle btn-ghost tooltip tooltip-bottom"
                  data-tip="Delete"
                  aria-label="Delete member"
                  onclick={(e) => { e.stopPropagation(); confirmingDelete = member.id; }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Load more -->
      {#if hasMore}
        <div class="px-4 py-3 border-t border-base-200">
          <button
            class="btn btn-ghost btn-sm w-full text-base-content/60"
            onclick={loadMore}
            disabled={loadingMore}
          >
            {#if loadingMore}
              <span class="loading loading-spinner loading-xs"></span>
              Loading…
            {:else}
              Load more members
            {/if}
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Member detail modal (rendered outside drawer to avoid z-index clipping) -->
<MemberDetailModal
  open={!!selectedMemberId}
  {programId}
  memberId={selectedMemberId}
  onClose={() => selectedMemberId = null}
/>
