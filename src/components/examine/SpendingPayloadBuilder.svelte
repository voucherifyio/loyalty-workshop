<script>
  let {
    memberId = '',
    payload = $bindable({
      customer_identification: { type: 'member_id', member_id: '' },
      customer: { metadata: {} },
      member: { metadata: {} }
    })
  } = $props();

  // Sync member ID
  $effect(() => {
    if (memberId && payload.customer_identification) {
      payload.customer_identification.member_id = memberId;
    }
  });

  // Metadata helpers for customer
  let customerMetaEntries = $state([]);
  
  $effect(() => {
    // Sync from payload to entries for display
    if (payload.customer?.metadata) {
      customerMetaEntries = Object.entries(payload.customer.metadata).map(([key, value]) => ({ key, value }));
    }
  });

  function addCustomerMetadata() {
    customerMetaEntries = [...customerMetaEntries, { key: '', value: '' }];
  }

  function removeCustomerMetadata(index) {
    customerMetaEntries = customerMetaEntries.filter((_, i) => i !== index);
    updateCustomerMetadata();
  }

  function updateCustomerMetadata() {
    const metadata = {};
    customerMetaEntries.forEach(entry => {
      if (entry.key.trim()) {
        metadata[entry.key] = entry.value;
      }
    });
    payload.customer = { metadata };
  }

  // Metadata helpers for member
  let memberMetaEntries = $state([]);
  
  $effect(() => {
    // Sync from payload to entries for display
    if (payload.member?.metadata) {
      memberMetaEntries = Object.entries(payload.member.metadata).map(([key, value]) => ({ key, value }));
    }
  });

  function addMemberMetadata() {
    memberMetaEntries = [...memberMetaEntries, { key: '', value: '' }];
  }

  function removeMemberMetadata(index) {
    memberMetaEntries = memberMetaEntries.filter((_, i) => i !== index);
    updateMemberMetadata();
  }

  function updateMemberMetadata() {
    const metadata = {};
    memberMetaEntries.forEach(entry => {
      if (entry.key.trim()) {
        metadata[entry.key] = entry.value;
      }
    });
    payload.member = { metadata };
  }
</script>

<div class="space-y-6">
  <!-- Customer Identification -->
  <div class="bg-base-200/50 rounded-xl p-4">
    <p class="text-sm font-semibold text-base-content/70 mb-3">Customer Identification</p>
    <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
      <span class="text-sm text-base-content/70">Member ID</span>
      <span class="font-mono text-sm">{memberId || 'Not provided'}</span>
    </div>
  </div>

  <!-- Customer Metadata -->
  <div class="bg-base-200/50 rounded-xl p-4">
    <p class="text-sm font-semibold text-base-content/70 mb-3">Customer Metadata (Optional)</p>
    <div class="space-y-2">
      {#each customerMetaEntries as entry, i}
        <div class="flex gap-2">
          <input
            type="text"
            class="input input-sm input-bordered flex-1"
            bind:value={entry.key}
            onchange={updateCustomerMetadata}
            placeholder="Key (e.g., vip_tier)"
          />
          <input
            type="text"
            class="input input-sm input-bordered flex-1"
            bind:value={entry.value}
            onchange={updateCustomerMetadata}
            placeholder="Value (e.g., platinum)"
          />
          <button
            class="btn btn-sm btn-ghost btn-circle"
            onclick={() => removeCustomerMetadata(i)}
          >
            ×
          </button>
        </div>
      {/each}
      <button class="btn btn-xs btn-outline" onclick={addCustomerMetadata}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Customer Metadata
      </button>
    </div>
  </div>

  <!-- Member Metadata -->
  <div class="bg-base-200/50 rounded-xl p-4">
    <p class="text-sm font-semibold text-base-content/70 mb-3">Member Metadata (Optional)</p>
    <div class="space-y-2">
      {#each memberMetaEntries as entry, i}
        <div class="flex gap-2">
          <input
            type="text"
            class="input input-sm input-bordered flex-1"
            bind:value={entry.key}
            onchange={updateMemberMetadata}
            placeholder="Key (e.g., loyalty_tier)"
          />
          <input
            type="text"
            class="input input-sm input-bordered flex-1"
            bind:value={entry.value}
            onchange={updateMemberMetadata}
            placeholder="Value (e.g., gold)"
          />
          <button
            class="btn btn-sm btn-ghost btn-circle"
            onclick={() => removeMemberMetadata(i)}
          >
            ×
          </button>
        </div>
      {/each}
      <button class="btn btn-xs btn-outline" onclick={addMemberMetadata}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Member Metadata
      </button>
    </div>
  </div>

  <!-- Summary -->
  <div class="alert alert-info">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-4 h-4">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div class="text-xs">
      Examining available rewards for member <strong>{memberId}</strong>
      {#if customerMetaEntries.length > 0 || memberMetaEntries.length > 0}
        with {customerMetaEntries.length + memberMetaEntries.length} metadata overlay(s)
      {/if}
    </div>
  </div>
</div>
