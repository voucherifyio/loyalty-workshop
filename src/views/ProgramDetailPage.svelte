<script>
  import { router, push } from "svelte-spa-router";
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { toast } from "../services/toast.js";
  import StatusBadge from "../components/StatusBadge.svelte";
  import CopyId from "../components/CopyId.svelte";
  import FeatureIcons from "../components/FeatureIcons.svelte";
  import ProgramDateRange from "../components/ProgramDateRange.svelte";

  let program = $state(null);
  let members = $state([]);
  let loadingProgram = $state(false);
  let loadingMembers = $state(false);
  let searchQuery = $state("");
  let currentPage = $state(1);
  let hasMore = $state(false);
  let nextCursor = $state(null);
  
  // Enrollment state
  let newCustomerId = $state("");
  let enrolling = $state(false);
  let enrollError = $state("");
  
  // Member actions state
  let confirmingDelete = $state(null);
  let deletingMember = $state(null);
  let togglingStatus = $state(null);

  const programId = $derived(router.params.programId);

  $effect(() => {
    if (programId) {
      fetchProgram();
      fetchMembers();
    }
  });

  async function fetchProgram() {
    loadingProgram = true;
    try {
      program = await api.get(endpoints.programs.get(programId));
    } catch (err) {
      toast.error(`Failed to load program: ${err.message || 'Unknown error'}`);
      program = null;
    } finally {
      loadingProgram = false;
    }
  }

  async function fetchMembers(cursor = null) {
    loadingMembers = true;
    try {
      const params = { limit: 20 };
      if (cursor) params.cursor = cursor;
      
      const response = await api.get(
        endpoints.members.list(programId, params)
      );
      
      if (cursor) {
        members = [...members, ...(response.data || [])];
      } else {
        members = response.data || [];
      }
      
      nextCursor = response.cursor?.next ?? null;
      hasMore = !!nextCursor;
    } catch (err) {
      toast.error(`Failed to load members: ${err.message || 'Unknown error'}`);
      members = [];
    } finally {
      loadingMembers = false;
    }
  }

  function loadMore() {
    if (!nextCursor || loadingMembers) return;
    fetchMembers(nextCursor);
  }

  function handleMemberClick(memberId) {
    push(`/programs/${programId}/members/${memberId}`);
  }

  function goBack() {
    push('/');
  }

  const filteredMembers = $derived.by(() => {
    if (!searchQuery.trim()) return members;
    const query = searchQuery.toLowerCase();
    return members.filter(m => 
      m.id?.toLowerCase().includes(query) ||
      m.customer_id?.toLowerCase().includes(query)
    );
  });

  async function enrollMember() {
    const customerId = newCustomerId.trim();
    if (!customerId) return;
    enrollError = "";
    enrolling = true;
    try {
      const member = await api.post(endpoints.members.create(programId), { 
        customer_id: customerId 
      });
      members = [member, ...members];
      newCustomerId = "";
      toast.success('Member enrolled successfully');
    } catch (err) {
      enrollError = err?.details || err?.message || "Enrollment failed";
    } finally {
      enrolling = false;
    }
  }

  async function toggleStatus(member) {
    togglingStatus = member.id;
    try {
      const endpoint = member.status === "ACTIVE"
        ? endpoints.members.deactivate(programId, member.id)
        : endpoints.members.activate(programId, member.id);
      const updated = await api.post(endpoint, {});
      members = members.map((m) => (m.id === member.id ? { ...m, ...updated } : m));
      toast.success(`Member ${member.status === 'ACTIVE' ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error("Failed to toggle member status");
    } finally {
      togglingStatus = null;
    }
  }

  async function deleteMember(memberId) {
    deletingMember = memberId;
    try {
      await api.delete(endpoints.members.delete(programId, memberId));
      members = members.filter((m) => m.id !== memberId);
      confirmingDelete = null;
      toast.success('Member deleted');
    } catch {
      toast.error("Failed to delete member");
    } finally {
      deletingMember = null;
    }
  }

  function formatDate(iso) {
    if (!iso) return "–";
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
</script>

<div class="p-6 space-y-6">
  {#if loadingProgram}
    <div class="flex items-center justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
  {:else if !program}
    <div class="bg-base-200/50 rounded-xl p-8 text-center">
      <p class="text-base-content/60 mb-4">Program not found</p>
      <button class="btn btn-primary btn-sm" onclick={goBack}>
        Back to Programs
      </button>
    </div>
  {:else}
    <!-- Program Header Card -->
    <div class="bg-base-200/50 rounded-xl p-5">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <button
              class="btn btn-ghost btn-sm btn-circle"
              onclick={goBack}
              title="Back to programs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 class="text-2xl font-bold">{program.name || program.id}</h1>
          </div>
          <div class="flex items-center gap-2 ml-14">
            {#if program.status}
              <StatusBadge status={program.status} />
            {/if}
            <CopyId id={program.id} />
          </div>
        </div>
      </div>

      <div class="ml-14">
        <ProgramDateRange startDate={program.start_date} endDate={program.end_date} />
        <FeatureIcons entityType="programs" item={program} />

        {#if program.assignments}
          <div class="flex items-center gap-3 flex-wrap text-sm text-base-content/60 mt-4 pt-4 border-t border-base-200">
            <span class="text-base-content/40">Uses</span>
            <span class="font-medium">Cards <span class="badge badge-xs badge-ghost">{program.assignments.cardDefinitions}</span></span>
            <span class="font-medium">Rules <span class="badge badge-xs badge-ghost">{program.assignments.earningRules}</span></span>
            <span class="font-medium">Rewards <span class="badge badge-xs badge-ghost">{program.assignments.rewards}</span></span>
            <span class="font-medium">Tiers <span class="badge badge-xs badge-ghost">{program.assignments.tierStructures}</span></span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Members List Card -->
    <div class="bg-base-200/50 rounded-xl p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold">Members</h2>
        <div class="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search members..."
            class="input input-sm input-bordered w-64"
            bind:value={searchQuery}
          />
          <span class="text-xs text-base-content/60">
            {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <!-- Enrollment Form -->
      <div class="mb-4 p-4 bg-base-200/60 rounded-lg">
        <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-2">
          Enroll New Member
        </p>
        <div class="flex gap-2 items-start">
          <div class="flex-1">
            <input
              type="text"
              class="input input-sm input-bordered w-full font-mono text-xs"
              placeholder="customer_id"
              bind:value={newCustomerId}
              onkeydown={(e) => e.key === "Enter" && enrollMember()}
              disabled={enrolling}
            />
            {#if enrollError}
              <p class="text-xs text-error mt-1.5">{enrollError}</p>
            {/if}
          </div>
          <button
            class="btn btn-sm btn-primary"
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
      </div>

      {#if loadingMembers && members.length === 0}
        <div class="flex items-center justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
        </div>
      {:else if filteredMembers.length === 0}
        <p class="text-sm text-base-content/50 text-center py-8 bg-base-200 rounded-lg">
          {searchQuery ? 'No members found matching your search' : 'No members found'}
        </p>
      {:else}
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Member ID</th>
                <th>Customer ID</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredMembers as member (member.id)}
                <tr class="hover:bg-base-300/50 transition-colors relative">
                  {#if confirmingDelete === member.id}
                    <td colspan="5" class="!p-0">
                      <div class="absolute inset-0 bg-base-100/95 flex items-center gap-3 px-4 z-10">
                        <span class="text-sm text-base-content/70 flex-1">
                          Delete this member permanently?
                        </span>
                        <button
                          class="btn btn-xs btn-ghost"
                          onclick={() => (confirmingDelete = null)}
                          disabled={!!deletingMember}
                        >
                          Cancel
                        </button>
                        <button
                          class="btn btn-xs btn-error"
                          onclick={() => deleteMember(member.id)}
                          disabled={!!deletingMember}
                        >
                          {deletingMember === member.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  {:else}
                    <td>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs">{member.id}</span>
                        <CopyId id={member.id} />
                      </div>
                    </td>
                    <td>
                      <span class="text-sm">{member.customer_id || "-"}</span>
                    </td>
                    <td>
                      {#if member.status}
                        <StatusBadge status={member.status} />
                      {:else}
                        <span class="text-base-content/40">-</span>
                      {/if}
                    </td>
                    <td>
                      <span class="text-xs text-base-content/60">
                        {formatDate(member.created_at)}
                      </span>
                    </td>
                    <td class="text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          class="btn btn-xs btn-circle btn-primary tooltip tooltip-left"
                          data-tip="View Details"
                          aria-label="View member details"
                          onclick={() => handleMemberClick(member.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3 h-3">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </button>
                        {#if member.status === "ACTIVE"}
                          <button
                            class="btn btn-xs btn-circle btn-error tooltip tooltip-left"
                            data-tip="Deactivate"
                            onclick={(e) => {
                              e.stopPropagation();
                              toggleStatus(member);
                            }}
                            disabled={togglingStatus === member.id}
                          >
                            {#if togglingStatus === member.id}
                              <span class="loading loading-spinner loading-xs"></span>
                            {:else}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-3 h-3"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                                />
                              </svg>
                            {/if}
                          </button>
                        {:else if member.status === "INACTIVE"}
                          <button
                            class="btn btn-xs btn-circle btn-success tooltip tooltip-left"
                            data-tip="Activate"
                            onclick={(e) => {
                              e.stopPropagation();
                              toggleStatus(member);
                            }}
                            disabled={togglingStatus === member.id}
                          >
                            {#if togglingStatus === member.id}
                              <span class="loading loading-spinner loading-xs"></span>
                            {:else}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke-width="1.5"
                                stroke="currentColor"
                                class="w-3 h-3"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                                />
                              </svg>
                            {/if}
                          </button>
                        {/if}
                        <button
                          class="btn btn-xs btn-circle btn-ghost tooltip tooltip-left"
                          data-tip="Delete"
                          aria-label="Delete member"
                          onclick={(e) => {
                            e.stopPropagation();
                            confirmingDelete = member.id;
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                            class="w-3 h-3"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  {/if}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if hasMore}
          <div class="flex justify-center mt-4">
            <button
              class="btn btn-sm btn-ghost"
              onclick={loadMore}
              disabled={loadingMembers}
            >
              {loadingMembers ? 'Loading...' : 'Load More'}
            </button>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>
