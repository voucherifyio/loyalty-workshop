<script>
  import MetadataEditor from '../shared/MetadataEditor.svelte';

  let {
    memberId = '',
    payload = $bindable({
      trigger: { type: 'SPECIFIC', specific: { event: 'customer.order.paid' } },
      customer_identification: { type: 'member_id', member_id: '' },
      customer_order_paid: { order: { amount: '' }, customer: { metadata: {} }, member: { metadata: {} } },
      customer_segment_entered: { customer: { metadata: {} }, member: { metadata: {} } },
      customer_custom_event: { type: 'ALL', all: { custom_event: { metadata: {} }, customer: { metadata: {} }, member: { metadata: {} } } }
    }),
    onValidationChange = (isValid) => {}
  } = $props();

  // Sync member ID
  $effect(() => {
    if (memberId && payload.customer_identification) {
      payload.customer_identification.member_id = memberId;
    }
  });

  // Validation
  const isValid = $derived(() => {
    if (payload?.trigger?.type === 'SPECIFIC') {
      const event = payload.trigger?.specific?.event;
      if (event === 'customer.order.paid') {
        return payload.customer_order_paid?.order?.amount && !isNaN(parseInt(payload.customer_order_paid?.order?.amount || ''));
      }
      if (event === 'customer.custom_event') {
        if (payload.customer_custom_event?.type === 'SPECIFIC') {
          return payload.customer_custom_event?.specific?.custom_event?.schema_id?.trim();
        }
        return true; // ALL mode doesn't require schema_id
      }
      return true; // SEGMENT_ENTERED has no required fields
    }
    return true; // ALL mode requires checking all relevant sections
  });

  $effect(() => {
    onValidationChange(isValid());
  });

  // Order items
  let orderItems = $state([]);
  
  function addOrderItem() {
    orderItems = [...orderItems, {
      product_id: '',
      sku_id: '',
      quantity: 1,
      price: '',
      amount: '',
      metadata: {}
    }];
  }

  function removeOrderItem(index) {
    orderItems = orderItems.filter((_, i) => i !== index);
  }

  // Metadata helpers
  function addMetadata(target, key = 'metadata') {
    if (!target[key]) target[key] = {};
    const newKey = `key_${Date.now()}`;
    target[key][newKey] = '';
  }

  function removeMetadata(target, key, metaKey) {
    delete target[key][metaKey];
  }

  // Customer metadata management (applies to all event types)
  let customerMetaEntries = $state([]);

  // Sync customer metadata from payload to entries on load
  $effect(() => {
    // Get metadata from the first available source
    let metadata = {};
    if (payload.customer_order_paid?.customer?.metadata) {
      metadata = payload.customer_order_paid.customer.metadata;
    } else if (payload.customer_segment_entered?.customer?.metadata) {
      metadata = payload.customer_segment_entered.customer.metadata;
    } else if (payload.customer_custom_event?.type === 'ALL' && payload.customer_custom_event.all?.customer?.metadata) {
      metadata = payload.customer_custom_event.all.customer.metadata;
    } else if (payload.customer_custom_event?.type === 'SPECIFIC' && payload.customer_custom_event.specific?.customer?.metadata) {
      metadata = payload.customer_custom_event.specific.customer.metadata;
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      customerMetaEntries = Object.entries(metadata).map(([key, value]) => ({ key, value }));
    }
  });

  function addCustomerMetadata() {
    customerMetaEntries = [...customerMetaEntries, { key: '', value: '' }];
  }

  function removeCustomerMetadata(index) {
    customerMetaEntries = customerMetaEntries.filter((_, i) => i !== index);
    updateAllCustomerMetadata();
  }

  function updateCustomerMetadataValue() {
    updateAllCustomerMetadata();
  }

  function updateAllCustomerMetadata() {
    const metadata = {};
    customerMetaEntries.forEach(entry => {
      if (entry.key.trim()) {
        metadata[entry.key] = entry.value;
      }
    });
    
    // Update metadata in all event types
    if (payload.customer_order_paid?.customer) {
      payload.customer_order_paid.customer.metadata = { ...metadata };
    }
    if (payload.customer_segment_entered?.customer) {
      payload.customer_segment_entered.customer.metadata = { ...metadata };
    }
    if (payload.customer_custom_event?.type === 'ALL' && payload.customer_custom_event.all?.customer) {
      payload.customer_custom_event.all.customer.metadata = { ...metadata };
    }
    if (payload.customer_custom_event?.type === 'SPECIFIC' && payload.customer_custom_event.specific?.customer) {
      payload.customer_custom_event.specific.customer.metadata = { ...metadata };
    }
  }

  // Member metadata management (applies to all event types)
  let memberMetaEntries = $state([]);

  // Sync member metadata from payload to entries on load
  $effect(() => {
    // Get metadata from the first available source
    let metadata = {};
    if (payload.customer_order_paid?.member?.metadata) {
      metadata = payload.customer_order_paid.member.metadata;
    } else if (payload.customer_segment_entered?.member?.metadata) {
      metadata = payload.customer_segment_entered.member.metadata;
    } else if (payload.customer_custom_event?.type === 'ALL' && payload.customer_custom_event.all?.member?.metadata) {
      metadata = payload.customer_custom_event.all.member.metadata;
    } else if (payload.customer_custom_event?.type === 'SPECIFIC' && payload.customer_custom_event.specific?.member?.metadata) {
      metadata = payload.customer_custom_event.specific.member.metadata;
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      memberMetaEntries = Object.entries(metadata).map(([key, value]) => ({ key, value }));
    }
  });

  function addMemberMetadata() {
    memberMetaEntries = [...memberMetaEntries, { key: '', value: '' }];
  }

  function removeMemberMetadata(index) {
    memberMetaEntries = memberMetaEntries.filter((_, i) => i !== index);
    updateAllMemberMetadata();
  }

  function updateMemberMetadataValue() {
    updateAllMemberMetadata();
  }

  function updateAllMemberMetadata() {
    const metadata = {};
    memberMetaEntries.forEach(entry => {
      if (entry.key.trim()) {
        metadata[entry.key] = entry.value;
      }
    });
    
    // Update metadata in all event types
    if (payload.customer_order_paid?.member) {
      payload.customer_order_paid.member.metadata = { ...metadata };
    }
    if (payload.customer_segment_entered?.member) {
      payload.customer_segment_entered.member.metadata = { ...metadata };
    }
    if (payload.customer_custom_event?.type === 'ALL' && payload.customer_custom_event.all?.member) {
      payload.customer_custom_event.all.member.metadata = { ...metadata };
    }
    if (payload.customer_custom_event?.type === 'SPECIFIC' && payload.customer_custom_event.specific?.member) {
      payload.customer_custom_event.specific.member.metadata = { ...metadata };
    }
  }
</script>

<div class="space-y-6">
  <!-- Trigger Selection -->
  <div class="bg-base-200/50 rounded-xl p-4">
    <p class="text-sm font-semibold text-base-content/70 mb-3">Trigger Configuration</p>
    <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
      <span class="text-sm text-base-content/70">Trigger Type</span>
      <div class="join">
        <button
          class="btn btn-sm join-item {payload.trigger.type === 'SPECIFIC' ? 'btn-primary' : 'btn-outline'}"
          onclick={() => {
            payload.trigger = { type: 'SPECIFIC', specific: { event: 'customer.order.paid' } };
            // Ensure data structure exists for default event
            if (!payload.customer_order_paid) {
              payload.customer_order_paid = {
                order: { amount: '' },
                customer: { metadata: {} },
                member: { metadata: {} }
              };
            }
          }}
        >
          SPECIFIC
        </button>
        <button
          class="btn btn-sm join-item {payload.trigger.type === 'ALL' ? 'btn-primary' : 'btn-outline'}"
          onclick={() => {
            payload.trigger = { type: 'ALL' };
            // Ensure all data structures exist for ALL mode
            if (!payload.customer_order_paid) {
              payload.customer_order_paid = {
                order: { amount: '' },
                customer: { metadata: {} },
                member: { metadata: {} }
              };
            }
            if (!payload.customer_segment_entered) {
              payload.customer_segment_entered = {
                customer: { metadata: {} },
                member: { metadata: {} }
              };
            }
            if (!payload.customer_custom_event) {
              payload.customer_custom_event = {
                type: 'ALL',
                all: {
                  custom_event: { metadata: {} },
                  customer: { metadata: {} },
                  member: { metadata: {} }
                }
              };
            }
          }}
        >
          ALL
        </button>
      </div>

      {#if payload.trigger.type === 'SPECIFIC'}
        <span class="text-sm text-base-content/70">Event Type</span>
        <div class="join">
          <button
            class="btn btn-sm join-item {payload.trigger.specific.event === 'customer.order.paid' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => {
              payload.trigger.specific.event = 'customer.order.paid';
              // Ensure data structure exists
              if (!payload.customer_order_paid) {
                payload.customer_order_paid = {
                  order: { amount: '' },
                  customer: { metadata: {} },
                  member: { metadata: {} }
                };
              }
            }}
          >
            Order Paid
          </button>
          <button
            class="btn btn-sm join-item {payload.trigger.specific.event === 'customer.segment.entered' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => {
              payload.trigger.specific.event = 'customer.segment.entered';
              // Ensure data structure exists
              if (!payload.customer_segment_entered) {
                payload.customer_segment_entered = {
                  customer: { metadata: {} },
                  member: { metadata: {} }
                };
              }
            }}
          >
            Segment Entered
          </button>
          <button
            class="btn btn-sm join-item {payload.trigger.specific.event === 'customer.custom_event' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => {
              payload.trigger.specific.event = 'customer.custom_event';
              // Ensure data structure exists
              if (!payload.customer_custom_event) {
                payload.customer_custom_event = {
                  type: 'ALL',
                  all: {
                    custom_event: { metadata: {} },
                    customer: { metadata: {} },
                    member: { metadata: {} }
                  }
                };
              }
            }}
          >
            Custom Event
          </button>
        </div>
      {/if}

      <span class="text-sm text-base-content/70">Member ID</span>
      <span class="font-mono text-sm">{memberId || 'Not provided'}</span>
    </div>
  </div>

  <!-- Event-Specific Sections -->
  {#if payload.trigger?.type === 'SPECIFIC' && payload.trigger?.specific?.event === 'customer.order.paid'}
    <!-- Order Paid Section -->
    <div class="bg-base-200/50 rounded-xl p-4">
      <p class="text-sm font-semibold text-base-content/70 mb-3">Order Data</p>
      <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
        <span class="text-sm text-base-content/70">Amount (cents)</span>
        <input
          type="number"
          class="input input-sm input-bordered"
          bind:value={payload.customer_order_paid.order.amount}
          placeholder="10000"
          min="0"
        />

        <span class="text-sm text-base-content/70 self-start pt-2">Order Items</span>
        <div class="space-y-2">
          <button class="btn btn-xs btn-outline" onclick={addOrderItem}>
            Add Item
          </button>
          {#each orderItems as item, i}
            <div class="bg-base-300 rounded p-2 text-xs space-y-2">
              <div class="flex justify-between">
                <span class="font-semibold">Item {i + 1}</span>
                <button class="btn btn-xs btn-ghost btn-circle" onclick={() => removeOrderItem(i)}>×</button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <input type="text" class="input input-xs" bind:value={item.product_id} placeholder="Product ID" />
                <input type="text" class="input input-xs" bind:value={item.sku_id} placeholder="SKU ID" />
                <input type="number" class="input input-xs" bind:value={item.quantity} placeholder="Quantity" />
                <input type="number" class="input input-xs" bind:value={item.price} placeholder="Price" />
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {:else if payload.trigger?.type === 'SPECIFIC' && payload.trigger?.specific?.event === 'customer.custom_event'}
    <!-- Custom Event Section -->
    <div class="bg-base-200/50 rounded-xl p-4">
      <p class="text-sm font-semibold text-base-content/70 mb-3">Custom Event Data</p>
      <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
        <span class="text-sm text-base-content/70">Event Mode</span>
        <div class="join">
          <button
            class="btn btn-sm join-item {payload.customer_custom_event?.type === 'ALL' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => {
              payload.customer_custom_event = { type: 'ALL', all: { custom_event: { metadata: {} }, customer: { metadata: {} }, member: { metadata: {} } } };
            }}
          >
            ALL
          </button>
          <button
            class="btn btn-sm join-item {payload.customer_custom_event?.type === 'SPECIFIC' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => {
              payload.customer_custom_event = { type: 'SPECIFIC', specific: { custom_event: { schema_id: '', metadata: {} }, customer: { metadata: {} }, member: { metadata: {} } } };
            }}
          >
            SPECIFIC
          </button>
        </div>

        {#if payload.customer_custom_event?.type === 'SPECIFIC'}
          <span class="text-sm text-base-content/70">Schema ID</span>
          <input
            type="text"
            class="input input-sm input-bordered"
            bind:value={payload.customer_custom_event.specific.custom_event.schema_id}
            placeholder="ces_..."
          />
        {/if}
      </div>
    </div>
  {:else if payload.trigger?.type === 'SPECIFIC' && payload.trigger?.specific?.event === 'customer.segment.entered'}
    <!-- Segment Entered Section -->
    <div class="bg-base-200/50 rounded-xl p-4">
      <p class="text-sm font-semibold text-base-content/70 mb-3">Segment Entry Data</p>
      <p class="text-xs text-base-content/50">No required fields for segment entry. Use metadata overlays below to test scenarios.</p>
    </div>
  {/if}

  {#if payload.trigger?.type === 'ALL'}
    <!-- ALL Triggers - Show simplified sections -->
    <div class="bg-base-200/50 rounded-xl p-4">
      <p class="text-sm font-semibold text-base-content/70 mb-3">All Triggers Mode</p>
      <p class="text-xs text-base-content/50 mb-3">Provide data for all trigger types. Each earning rule will use relevant data.</p>
      
      <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
        <span class="text-sm text-base-content/70">Order Amount</span>
        <input
          type="number"
          class="input input-sm input-bordered"
          bind:value={payload.customer_order_paid.order.amount}
          placeholder="10000 (for ORDER_PAID rules)"
          min="0"
        />
      </div>
    </div>
  {/if}

  <!-- Customer Metadata (Optional) -->
  <div class="bg-base-200/50 rounded-xl p-4">
    <p class="text-xs text-base-content/50 mb-3">Add metadata to simulate "what-if" scenarios (e.g., VIP status, customer tier)</p>
    <MetadataEditor
      bind:entries={customerMetaEntries}
      label="Customer Metadata"
      keyPlaceholder="Key (e.g., vip_tier)"
      valuePlaceholder="Value (e.g., platinum)"
      onChange={updateCustomerMetadataValue}
    />
  </div>

  <!-- Member Metadata (Optional) -->
  <div class="bg-base-200/50 rounded-xl p-4">
    <p class="text-xs text-base-content/50 mb-3">Add member-specific metadata (e.g., loyalty tier, membership level)</p>
    <MetadataEditor
      bind:entries={memberMetaEntries}
      label="Member Metadata"
      keyPlaceholder="Key (e.g., loyalty_tier)"
      valuePlaceholder="Value (e.g., gold)"
      onChange={updateMemberMetadataValue}
    />
  </div>

  <!-- Summary -->
  <div class="alert alert-info">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-4 h-4">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div class="text-xs">
      {#if payload.trigger?.type === 'SPECIFIC'}
        Examining <strong>{payload.trigger?.specific?.event}</strong> trigger for member <strong>{memberId}</strong>
      {:else}
        Examining <strong>all triggers</strong> for member <strong>{memberId}</strong>
      {/if}
      {#if customerMetaEntries.length > 0 || memberMetaEntries.length > 0}
        with {customerMetaEntries.length + memberMetaEntries.length} metadata overlay(s)
      {/if}
    </div>
  </div>
</div>
