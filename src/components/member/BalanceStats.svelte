<script>
  import { formatDate, formatNum } from "../../utils/transactionFormatting.js";

  let {
    balance,
    nextExpiration = null,
    nextActivation = null,
  } = $props();
</script>

<div>
  <p class="text-xs font-bold text-base-content/40 uppercase tracking-widest mb-3">
    Balance
  </p>
  <div class="grid grid-cols-2 gap-3">
    <!-- Available points + next expiration -->
    <div class="bg-base-200 rounded-xl p-4">
      <p class="text-3xl font-bold text-primary">
        {formatNum(balance?.points)}
      </p>
      <p class="text-xs text-base-content/50 mt-1">Available Points</p>
      {#if nextExpiration}
        <div class="mt-3 pt-3 border-t border-base-300">
          <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wide mb-1">
            Next Expiration
          </p>
          <p class="text-sm font-bold text-warning">
            {formatDate(nextExpiration.date)}
          </p>
          <p class="text-xs text-base-content/50">
            {formatNum(nextExpiration.points)} pts expiring
          </p>
        </div>
      {/if}
    </div>

    <!-- Pending points + next activation -->
    <div class="bg-base-200 rounded-xl p-4">
      <p class="text-3xl font-bold text-warning">
        {formatNum(balance?.pending_points)}
      </p>
      <p class="text-xs text-base-content/50 mt-1">Pending Points</p>
      {#if nextActivation}
        <div class="mt-3 pt-3 border-t border-base-300">
          <p class="text-[10px] font-semibold text-base-content/40 uppercase tracking-wide mb-1">
            Next Activation
          </p>
          <p class="text-sm font-bold text-info">
            {formatDate(nextActivation.date)}
          </p>
          <p class="text-xs text-base-content/50">
            {formatNum(nextActivation.points)} pts activating
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>
