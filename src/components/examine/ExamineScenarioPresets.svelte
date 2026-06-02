<script>
  let {
    memberId = '',
    onPresetSelected = (payload) => {}
  } = $props();

  const presets = [
    {
      id: 'simple-order',
      name: 'Simple Order',
      description: 'Basic order purchase with amount only',
      icon: '🛒',
      payload: {
        trigger: { type: 'SPECIFIC', specific: { event: 'customer.order.paid' } },
        customer_identification: { type: 'member_id', member_id: memberId },
        customer_order_paid: {
          order: { amount: 10000 },
          customer: { metadata: {} },
          member: { metadata: {} }
        }
      }
    },
    {
      id: 'order-with-items',
      name: 'Order with Items',
      description: 'Order with product line items',
      icon: '📦',
      payload: {
        trigger: { type: 'SPECIFIC', specific: { event: 'customer.order.paid' } },
        customer_identification: { type: 'member_id', member_id: memberId },
        customer_order_paid: {
          order: {
            amount: 15000,
            items: [
              { product_id: 'prod_shoes_001', sku_id: 'sku_red_9', quantity: 1, price: 8000, amount: 8000 },
              { product_id: 'prod_socks_002', sku_id: 'sku_blue_m', quantity: 2, price: 1500, amount: 3000 },
              { product_id: 'prod_hat_003', quantity: 1, price: 4000, amount: 4000 }
            ]
          },
          customer: { metadata: {} },
          member: { metadata: {} }
        }
      }
    },
    {
      id: 'custom-event-specific',
      name: 'Custom Event',
      description: 'Specific custom event trigger',
      icon: '⚡',
      payload: {
        trigger: { type: 'SPECIFIC', specific: { event: 'customer.custom_event' } },
        customer_identification: { type: 'member_id', member_id: memberId },
        customer_custom_event: {
          type: 'SPECIFIC',
          specific: {
            custom_event: {
              schema_id: 'ces_example_schema',
              metadata: { action: 'completed', category: 'engagement' }
            },
            customer: { metadata: {} },
            member: { metadata: {} }
          }
        }
      }
    },
    {
      id: 'segment-entered',
      name: 'Segment Entry',
      description: 'Customer entering a segment',
      icon: '🎯',
      payload: {
        trigger: { type: 'SPECIFIC', specific: { event: 'customer.segment.entered' } },
        customer_identification: { type: 'member_id', member_id: memberId },
        customer_segment_entered: {
          customer: { metadata: {} },
          member: { metadata: {} }
        }
      }
    },
    {
      id: 'all-triggers',
      name: 'All Triggers',
      description: 'Test all trigger types at once',
      icon: '🌐',
      payload: {
        trigger: { type: 'ALL' },
        customer_identification: { type: 'member_id', member_id: memberId },
        customer_order_paid: {
          order: { amount: 10000 },
          customer: { metadata: {} },
          member: { metadata: {} }
        },
        customer_segment_entered: {
          customer: { metadata: {} },
          member: { metadata: {} }
        },
        customer_custom_event: {
          type: 'ALL',
          all: {
            custom_event: { metadata: {} },
            customer: { metadata: {} },
            member: { metadata: {} }
          }
        }
      }
    },
    {
      id: 'vip-scenario',
      name: 'VIP Customer',
      description: 'High-value order with VIP status',
      icon: '👑',
      payload: {
        trigger: { type: 'SPECIFIC', specific: { event: 'customer.order.paid' } },
        customer_identification: { type: 'member_id', member_id: memberId },
        customer_order_paid: {
          order: {
            amount: 50000,
            metadata: { channel: 'premium', payment_method: 'gold_card' }
          },
          customer: {
            metadata: { vip_status: 'gold', lifetime_value: '10000' }
          },
          member: {
            metadata: { tier: 'platinum', years_active: '5' }
          }
        }
      }
    }
  ];

  function selectPreset(preset) {
    // Update member_id in the payload before passing
    const payload = JSON.parse(JSON.stringify(preset.payload));
    payload.customer_identification.member_id = memberId;
    onPresetSelected(payload);
  }
</script>

<div class="space-y-3">
  <div class="flex items-center gap-2">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-primary">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
    <h3 class="font-semibold">Quick Start Scenarios</h3>
  </div>

  <div class="grid grid-cols-2 gap-2">
    {#each presets as preset}
      <button
        class="btn btn-outline btn-sm justify-start h-auto py-2 text-left"
        onclick={() => selectPreset(preset)}
      >
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span class="text-lg">{preset.icon}</span>
            <span class="font-semibold text-sm">{preset.name}</span>
          </div>
          <p class="text-xs text-base-content/60 mt-1">{preset.description}</p>
        </div>
      </button>
    {/each}
  </div>
</div>
