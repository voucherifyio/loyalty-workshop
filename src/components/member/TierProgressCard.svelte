<script>
  import { formatDate, formatNum } from "../../utils/transactionFormatting.js";
  import SectionHeading from "../shared/SectionHeading.svelte";

  let { tierProgress, memberCard } = $props();

  const tp = $derived(tierProgress?.current);
  const tsId = $derived(tierProgress?.tier_structure?.id);
  const opportunities = $derived(tierProgress?.opportunities ?? []);
  const risks = $derived(tierProgress?.risks ?? []);
  
  const range = $derived(tp ? Math.max(tp.points.max - tp.points.min, 1) : 1);
  const pct = $derived(
    tp ? Math.min(100, Math.round(((tp.points.current - tp.points.min) / range) * 100)) : 0
  );

  const tierStart = $derived(
    memberCard?.created_at ? new Date(memberCard.created_at).getTime() : null
  );
  const tierEnd = $derived(
    tp?.expires_at ? new Date(tp.expires_at).getTime() : null
  );
  const tierNow = $derived(Date.now());
  const tierTimePct = $derived(
    tierStart && tierEnd
      ? Math.min(Math.max((tierNow - tierStart) / (tierEnd - tierStart), 0), 1)
      : null
  );

  const fmtTierDate = (d) =>
    new Date(d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
</script>

{#if tp}
  <div>
    <div class="mb-3">
      <SectionHeading>
        Tier Progress
      </SectionHeading>
    </div>
    <div class="bg-base-200 rounded-xl p-3">
      <div class="grid grid-cols-3 gap-4">
        <!-- Left: Risks -->
        <div class="space-y-2">
          <p class="text-[10px] font-semibold text-base-content/40 uppercase">
            Risks
            {#if risks.length > 0}
              <span class="badge badge-xs">{risks.length}</span>
            {/if}
          </p>
          {#if risks.length === 0}
            <div class="text-center py-4">
              <p class="text-xs text-base-content/40">No risks</p>
            </div>
          {:else}
            <div class="space-y-1.5">
              {#each risks.slice(0, 3) as risk, index (index)}
                {#if risk.type === 'TIER_DOWNGRADE'}
                  <div class="bg-error/10 border border-error/30 rounded p-2">
                    <div class="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-error shrink-0 mt-0.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-semibold text-error">Tier at Risk</p>
                        <p class="text-[9px] text-base-content/60 mt-0.5">
                          Downgrades {formatDate(risk.date)}
                        </p>
                        {#if risk.tier_id}
                          <p class="text-[9px] text-base-content/50 font-mono truncate mt-0.5">
                            → {risk.tier_id}
                          </p>
                        {/if}
                        {#if opportunities.length > 0}
                          <p class="text-[9px] text-warning font-semibold mt-1.5">
                            Take action to maintain tier
                          </p>
                        {/if}
                      </div>
                    </div>
                  </div>
                {:else}
                  <div class="bg-warning/10 border border-warning/30 rounded p-2">
                    <p class="text-xs font-semibold text-warning">{risk.type || 'Risk'}</p>
                    <p class="text-[9px] text-base-content/50">
                      {risk.description || ''}
                    </p>
                  </div>
                {/if}
              {/each}
              {#if risks.length > 3}
                <p class="text-[9px] text-base-content/40 text-center">
                  +{risks.length - 3} more
                </p>
              {/if}
            </div>
          {/if}
        </div>

        <!-- Center: Progress -->
        <div class="space-y-2">
          <div class="text-center">
            <p class="text-sm font-bold">{tp.name}</p>
            <p class="text-[9px] text-base-content/40">Current Tier</p>
            {#if tsId}
              <p class="text-[9px] font-mono text-base-content/40 mt-0.5">
                {tsId}
              </p>
            {/if}
          </div>
          <div class="h-4 rounded-lg bg-base-300 overflow-hidden">
            <div
              class="h-full rounded-lg bg-primary transition-all flex items-center justify-end pr-2"
              style="width: {Math.max(pct, 4)}%"
            >
              {#if pct >= 20}
                <span class="text-[8px] font-bold text-primary-content">{pct}%</span>
              {/if}
            </div>
          </div>
          <div class="text-center">
            <p class="text-xs font-semibold">{pct}%</p>
            <p class="text-[9px] text-base-content/40">
              {formatNum(tp.points.current)} / {formatNum(tp.points.max)} pts
            </p>
            {#if tp.expires_at}
              <p class="text-[9px] text-base-content/40 mt-1">
                Expires: {fmtTierDate(tp.expires_at)}
              </p>
            {/if}
          </div>
        </div>

        <!-- Right: Opportunities -->
        <div class="space-y-2">
          <p class="text-[10px] font-semibold text-base-content/40 uppercase">
            Opportunities
            {#if opportunities.length > 0}
              <span class="badge badge-xs">{opportunities.length}</span>
            {/if}
          </p>
          {#if opportunities.length === 0}
            <div class="text-center py-4">
              <p class="text-xs text-base-content/40">No opportunities</p>
            </div>
          {:else}
            <div class="space-y-1.5">
              {#each opportunities.slice(0, 3) as opp, index (index)}
                <div class="bg-base-300/30 rounded p-2">
                  <p class="text-xs font-semibold">{opp.tier_id}</p>
                  {#if opp.points === 0}
                    <p class="text-[9px] text-success">Eligible now</p>
                  {:else}
                    <p class="text-[9px] text-base-content/50">
                      +{formatNum(opp.points)} pts needed
                    </p>
                  {/if}
                </div>
              {/each}
              {#if opportunities.length > 3}
                <p class="text-[9px] text-base-content/40 text-center">
                  +{opportunities.length - 3} more
                </p>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
