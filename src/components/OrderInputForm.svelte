<script>
  let {
    mode = $bindable('reference'), // 'reference' | 'create'
    customerId = '',
    hideModeSelector = false, // Hide the reference/create mode selector
    // For reference mode:
    orderRefType = $bindable('id'), // 'id' | 'source_id'
    orderRefValue = $bindable(''),
    // For create mode:
    orderAmount = $bindable(''),
    createMode = $bindable('simple'), // 'simple' | 'items'
    orderItems = $bindable([]), // Array of items when createMode is 'items'
  } = $props();

  function isReferenceValid() {
    return orderRefValue.trim().length > 0;
  }

  function isCreateSimpleValid() {
    const amount = parseInt(orderAmount);
    return !isNaN(amount) && amount > 0;
  }

  function isCreateItemsValid() {
    if (orderItems.length === 0) return false;
    return orderItems.every(item => {
      const price = parseInt(item.price);
      const quantity = parseInt(item.quantity);
      return !isNaN(price) && price > 0 && !isNaN(quantity) && quantity > 0;
    });
  }

  function isCreateValid() {
    if (createMode === 'simple') {
      return isCreateSimpleValid();
    } else {
      return isCreateItemsValid();
    }
  }

  const isValid = $derived(
    mode === 'reference' ? isReferenceValid() : isCreateValid()
  );

  // Calculate total amount from items
  const totalAmount = $derived(
    orderItems.reduce((sum, item) => {
      const price = parseInt(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + (price * quantity);
    }, 0)
  );

  function addItem() {
    orderItems = [...orderItems, {
      price: '',
      quantity: '1',
      product_id: '',
      sku_id: ''
    }];
  }

  function removeItem(index) {
    orderItems = orderItems.filter((_, i) => i !== index);
  }

  function calculateItemAmount(item) {
    const price = parseInt(item.price) || 0;
    const quantity = parseInt(item.quantity) || 1;
    return price * quantity;
  }

  // Reset items when switching create modes
  $effect(() => {
    if (mode === 'create' && createMode === 'items' && orderItems.length === 0) {
      addItem();
    }
  });
</script>

<div class="space-y-4">
  <!-- Mode Selection -->
  {#if !hideModeSelector}
    <div class="card bg-base-200 p-4">
      <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
        <span class="text-sm text-base-content/70">Mode</span>
        <div class="join w-full">
          <button
            class="btn btn-sm join-item flex-1 {mode === 'reference' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => (mode = 'reference')}
          >
            Reference Existing
          </button>
          <button
            class="btn btn-sm join-item flex-1 {mode === 'create' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => (mode = 'create')}
          >
            Create New
          </button>
        </div>
      </div>
    </div>
  {/if}

  <div class="card bg-base-200 p-4">
    <div class="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 items-center">
    {#if mode === 'reference'}
      <!-- Reference Mode: Existing Order -->
      <span class="text-sm text-base-content/70">Reference Type</span>
      <div class="join">
        <button
          type="button"
          class="btn btn-sm join-item {orderRefType === 'id' ? 'btn-primary' : 'btn-outline'}"
          onclick={() => (orderRefType = 'id')}
        >
          Order ID
        </button>
        <button
          type="button"
          class="btn btn-sm join-item {orderRefType === 'source_id' ? 'btn-primary' : 'btn-outline'}"
          onclick={() => (orderRefType = 'source_id')}
        >
          Source ID
        </button>
      </div>

      <span class="text-sm text-base-content/70">{orderRefType === 'id' ? 'Order ID' : 'Source ID'}</span>
      <input
        type="text"
        class="input input-sm input-bordered w-full"
        bind:value={orderRefValue}
        placeholder={orderRefType === 'id' ? 'ord_...' : 'my_order_001'}
      />
    {:else}
      <!-- Create Mode: New Order -->
      {#if customerId}
        <span class="text-sm text-base-content/70">Customer ID</span>
        <span class="font-mono text-sm">{customerId}</span>
      {/if}

      <span class="text-sm text-base-content/70">Create Mode</span>
      <div class="join">
        <button
          type="button"
          class="btn btn-sm join-item {createMode === 'simple' ? 'btn-primary' : 'btn-outline'}"
          onclick={() => (createMode = 'simple')}
        >
          Without Items
        </button>
        <button
          type="button"
          class="btn btn-sm join-item {createMode === 'items' ? 'btn-primary' : 'btn-outline'}"
          onclick={() => (createMode = 'items')}
        >
          With Items
        </button>
      </div>

      {#if createMode === 'simple'}
        <span class="text-sm text-base-content/70">Amount (cents)</span>
        <input
          type="number"
          class="input input-sm input-bordered w-full"
          bind:value={orderAmount}
          placeholder="1000 (= $10.00)"
          min="1"
        />
      {/if}
    {/if}
    </div>
  </div>

  {#if mode === 'create' && createMode === 'items'}
    <!-- Items Editor -->
    <div class="card bg-base-200 p-4">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-base-content/70">Order Items</p>
          <button type="button" class="btn btn-xs btn-outline" onclick={addItem}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Item
          </button>
        </div>

        {#each orderItems as item, i (i)}
        <div class="bg-base-200 rounded-lg p-3 space-y-2">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-base-content/70">Item {i + 1}</span>
            <button
              type="button"
              class="btn btn-xs btn-ghost btn-circle"
              onclick={() => removeItem(i)}
              title="Remove item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-[80px_1fr] gap-x-2 gap-y-2 items-center text-xs">
            <span class="text-base-content/60">Price (cents)</span>
            <input
              type="number"
              class="input input-xs input-bordered"
              bind:value={item.price}
              placeholder="1000"
              min="1"
            />

            <span class="text-base-content/60">Quantity</span>
            <input
              type="number"
              class="input input-xs input-bordered"
              bind:value={item.quantity}
              placeholder="1"
              min="1"
            />

            <span class="text-base-content/60">Amount</span>
            <span class="font-mono text-xs">{calculateItemAmount(item)} cents</span>

            <span class="text-base-content/60">Product ID</span>
            <input
              type="text"
              class="input input-xs input-bordered"
              bind:value={item.product_id}
              placeholder="Optional"
            />

            <span class="text-base-content/60">SKU ID</span>
            <input
              type="text"
              class="input input-xs input-bordered"
              bind:value={item.sku_id}
              placeholder="Optional"
            />
          </div>
        </div>
      {/each}

        {#if orderItems.length > 0}
          <div class="flex items-center justify-between bg-base-300 rounded-lg p-3">
            <span class="text-sm font-semibold">Total Amount</span>
            <span class="text-sm font-bold font-mono">{totalAmount} cents (${(totalAmount / 100).toFixed(2)})</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if mode === 'create'}
    <div class="alert alert-info">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-4 h-4">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div class="text-xs">
        A new order will be created with status <code class="bg-base-300 px-1 py-0.5 rounded">PAID</code>
      </div>
    </div>
  {/if}
</div>
