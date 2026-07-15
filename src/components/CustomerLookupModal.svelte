<script>
  import { push } from "svelte-spa-router";
  import * as memberDataService from "../services/memberDataService.js";
  import { formatNum } from "../utils/transactionFormatting.js";
  import BaseModal from "./shared/BaseModal.svelte";
  import ModalHeader from "./shared/ModalHeader.svelte";
  import AlertBanner from "./shared/AlertBanner.svelte";
  import FormField from "./shared/FormField.svelte";
  import LoadingState from "./shared/LoadingState.svelte";
  import EmptyState from "./shared/EmptyState.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import CopyId from "./CopyId.svelte";

  let { open = false, onClose = () => {} } = $props();

  const IDENTIFICATION_TYPES = [
    { value: "customer_id", label: "Customer ID" },
    { value: "customer_source_id", label: "Customer Source ID" },
    { value: "member_id", label: "Member ID" },
  ];

  let identificationType = $state("customer_id");
  let identifier = $state("");
  let searching = $state(false);
  let hasSearched = $state(false);
  let error = $state("");
  let result = $state(null);

  const totalPoints = (memb) =>
    memb.cards?.reduce((sum, c) => sum + (c.card?.balance?.points ?? 0), 0) ?? 0;

  // Server errors come through as a JSON-stringified BaseError body; fall back
  // to the raw message when it isn't JSON (network errors, etc).
  function describeError(err) {
    try {
      const parsed = JSON.parse(err.message);
      return parsed.details || parsed.message || err.message;
    } catch {
      return err.message || "Lookup failed";
    }
  }

  async function handleSearch() {
    const value = identifier.trim();
    if (!value || searching) return;
    searching = true;
    hasSearched = true;
    error = "";
    result = null;
    try {
      result = await memberDataService.fetchCustomerMemberships(value, identificationType);
    } catch (err) {
      error = describeError(err);
    } finally {
      searching = false;
    }
  }

  function goToMember(programId, memberId) {
    handleClose();
    push(`/programs/${programId}/members/${memberId}`);
  }

  function reset() {
    identifier = "";
    identificationType = "customer_id";
    searching = false;
    hasSearched = false;
    error = "";
    result = null;
  }

  function handleClose() {
    reset();
    onClose();
  }
</script>

<BaseModal {open} size="lg" onClose={handleClose}>
  <ModalHeader
    title="Find Customer"
    subtitle="Look up a customer's loyalty memberships across every program"
    onClose={handleClose}
    disabled={searching}
  />

  <div class="space-y-4">
    <div class="grid grid-cols-[10rem_1fr] gap-3 items-start">
      <FormField label="Identify by" for="lookup-type">
        <select
          id="lookup-type"
          class="select select-sm select-bordered"
          bind:value={identificationType}
          disabled={searching}
        >
          {#each IDENTIFICATION_TYPES as t (t.value)}
            <option value={t.value}>{t.label}</option>
          {/each}
        </select>
      </FormField>

      <FormField label="Identifier" for="lookup-value">
        <div class="flex gap-2">
          <input
            id="lookup-value"
            type="text"
            class="input input-sm input-bordered w-full font-mono text-xs"
            placeholder="e.g. cust_9nQ8f3"
            bind:value={identifier}
            disabled={searching}
            onkeydown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            class="btn btn-sm btn-primary shrink-0"
            onclick={handleSearch}
            disabled={searching || !identifier.trim()}
          >
            {#if searching}
              <span class="loading loading-spinner loading-xs"></span>
            {:else}
              Search
            {/if}
          </button>
        </div>
      </FormField>
    </div>

    {#if searching}
      <LoadingState message="Searching memberships…" />
    {:else if error}
      <AlertBanner variant="error" title="Lookup failed">
        <div class="text-sm">{error}</div>
      </AlertBanner>
    {:else if hasSearched && result}
      <div class="space-y-3">
        <div class="bg-base-200/60 rounded-lg p-3 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-base-content/50 uppercase tracking-wide">Customer</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="font-mono text-sm">{result.customer?.id}</span>
              <CopyId id={result.customer?.id} />
            </div>
            {#if result.customer?.source_id}
              <p class="text-xs text-base-content/50 mt-1">Source ID: {result.customer.source_id}</p>
            {/if}
          </div>
          <span class="text-xs text-base-content/60 shrink-0">
            {result.memberships?.length || 0} membership{result.memberships?.length === 1 ? "" : "s"}
          </span>
        </div>

        {#if !result.memberships || result.memberships.length === 0}
          <EmptyState message="This customer has no loyalty memberships yet." />
        {:else}
          <div class="space-y-2 max-h-96 overflow-y-auto pr-1">
            {#each result.memberships as m (m.member.id)}
              <button
                type="button"
                class="w-full text-left bg-base-100 hover:bg-base-200 border border-base-300 rounded-lg p-3 transition-colors cursor-pointer"
                onclick={() => goToMember(m.program.id, m.member.id)}
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-sm truncate">{m.program.name || m.program.id}</span>
                      <StatusBadge status={m.program.status} />
                    </div>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="font-mono text-xs text-base-content/60">{m.member.id}</span>
                      <StatusBadge status={m.member.status} />
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <p class="text-xs text-base-content/40">
                      {m.cards?.length || 0} card{m.cards?.length === 1 ? "" : "s"}
                    </p>
                    <p class="text-sm font-semibold text-primary">
                      {formatNum(totalPoints(m))} pts
                    </p>
                  </div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="modal-action">
    <button class="btn btn-ghost" onclick={handleClose}>Close</button>
  </div>
</BaseModal>
