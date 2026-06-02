<script>
  let {
    memberId = '',
    onPresetSelected = (payload) => {}
  } = $props();

  const presets = [
    {
      id: 'basic',
      name: 'Basic Examination',
      description: 'Simple examination with no metadata',
      icon: '🎁',
      payload: {
        customer_identification: { type: 'member_id', member_id: memberId },
        customer: { metadata: {} },
        member: { metadata: {} }
      }
    },
    {
      id: 'vip-customer',
      name: 'VIP Customer',
      description: 'Simulate platinum tier customer',
      icon: '👑',
      payload: {
        customer_identification: { type: 'member_id', member_id: memberId },
        customer: {
          metadata: {
            vip_tier: 'platinum',
            lifetime_value: '50000'
          }
        },
        member: { metadata: {} }
      }
    },
    {
      id: 'long-term-member',
      name: 'Long-term Member',
      description: 'Gold loyalty tier member',
      icon: '⭐',
      payload: {
        customer_identification: { type: 'member_id', member_id: memberId },
        customer: { metadata: {} },
        member: {
          metadata: {
            loyalty_tier: 'gold',
            years_active: '5'
          }
        }
      }
    },
    {
      id: 'premium-tier',
      name: 'Premium Tier Test',
      description: 'Both customer and member premium status',
      icon: '💎',
      payload: {
        customer_identification: { type: 'member_id', member_id: memberId },
        customer: {
          metadata: {
            vip_tier: 'platinum',
            preferred_customer: 'true'
          }
        },
        member: {
          metadata: {
            loyalty_tier: 'diamond',
            special_access: 'true'
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
