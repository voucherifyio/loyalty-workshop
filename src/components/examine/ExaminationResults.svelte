<script>
  import { SvelteMap } from 'svelte/reactivity';
  import { formatNum } from '../../utils/transactionFormatting.js';
  import JsonDisplay from '../shared/JsonDisplay.svelte';

  let {
    results = null,
    groupBy = $bindable('earning_rule'), // 'earning_rule' | 'card'
    onRunAgain = () => {},
    onExport = () => {}
  } = $props();

  let showJson = $state(false);

  // Transform results for grouping by earning rule
  const byEarningRule = $derived(() => {
    if (!results || !results.memberships?.[0]) return [];
    
    const membership = results.memberships[0];
    const earningRuleMap = new SvelteMap();

    // Process cards
    membership.cards?.forEach(cardEst => {
      cardEst.earning_rules?.forEach(er => {
        if (!earningRuleMap.has(er.earning_rule.id)) {
          earningRuleMap.set(er.earning_rule.id, {
            id: er.earning_rule.id,
            name: results.earning_rules?.find(r => r.id === er.earning_rule.id)?.name || er.earning_rule.id,
            cards: [],
            incentives: [],
            totalPoints: 0
          });
        }
        const rule = earningRuleMap.get(er.earning_rule.id);
        rule.cards.push({
          card: cardEst.card,
          points: er.points_estimation
        });
        rule.totalPoints += er.points_estimation || 0;
      });
    });

    // Process incentives
    membership.incentives?.forEach(incEst => {
      incEst.earning_rules?.forEach(er => {
        if (!earningRuleMap.has(er.earning_rule.id)) {
          earningRuleMap.set(er.earning_rule.id, {
            id: er.earning_rule.id,
            name: results.earning_rules?.find(r => r.id === er.earning_rule.id)?.name || er.earning_rule.id,
            cards: [],
            incentives: [],
            totalPoints: 0
          });
        }
        const rule = earningRuleMap.get(er.earning_rule.id);
        rule.incentives.push(incEst.incentive);
      });
    });

    return Array.from(earningRuleMap.values());
  });

  // Transform results for grouping by card
  const byCard = $derived(() => {
    if (!results || !results.memberships?.[0]) return [];
    
    const membership = results.memberships[0];
    return membership.cards?.map(cardEst => ({
      card: cardEst.card,
      totalPoints: cardEst.points_estimation || 0,
      earningRules: cardEst.earning_rules?.map(er => ({
        id: er.earning_rule.id,
        name: results.earning_rules?.find(r => r.id === er.earning_rule.id)?.name || er.earning_rule.id,
        points: er.points_estimation
      })) || []
    })) || [];
  });

  const incentivesSummary = $derived(() => {
    if (!results || !results.memberships?.[0]) return [];
    return results.memberships[0].incentives?.map(incEst => ({
      incentive: incEst.incentive,
      earningRules: incEst.earning_rules?.map(er => 
        results.earning_rules?.find(r => r.id === er.earning_rule.id)?.name || er.earning_rule.id
      ) || []
    })) || [];
  });

  const grandTotalPoints = $derived(() => {
    if (groupBy === 'earning_rule') {
      return byEarningRule().reduce((sum, rule) => sum + rule.totalPoints, 0);
    } else {
      return byCard().reduce((sum, card) => sum + card.totalPoints, 0);
    }
  });
</script>

{#if results}
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-bold">Examination Results</h3>
        {#if results.event}
          <p class="text-sm text-base-content/60">Event: <span class="font-mono">{results.event}</span></p>
        {/if}
      </div>
      <div class="flex gap-2">
        <div class="join">
          <button
            class="btn btn-sm join-item {groupBy === 'earning_rule' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => (groupBy = 'earning_rule')}
          >
            By Earning Rule
          </button>
          <button
            class="btn btn-sm join-item {groupBy === 'card' ? 'btn-primary' : 'btn-outline'}"
            onclick={() => (groupBy = 'card')}
          >
            By Card
          </button>
        </div>
        <button class="btn btn-sm btn-outline" onclick={onExport}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export JSON
        </button>
        <button class="btn btn-sm btn-primary" onclick={onRunAgain}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Run Again
        </button>
      </div>
    </div>

    <!-- Grand Total -->
    <div class="bg-primary/10 border-2 border-primary rounded-xl p-4">
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold">Total Points Estimation</span>
        <span class="text-2xl font-bold text-primary">{formatNum(grandTotalPoints())}</span>
      </div>
    </div>

    {#if groupBy === 'earning_rule'}
      <!-- Group by Earning Rule View -->
      <div class="space-y-4">
        {#each byEarningRule() as rule (rule.id)}
          <div class="bg-base-200 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-bold">{rule.name}</h4>
                <p class="text-xs text-base-content/50 font-mono">{rule.id}</p>
              </div>
              <div class="badge badge-lg badge-primary">{formatNum(rule.totalPoints)} pts</div>
            </div>

            {#if rule.cards.length > 0}
              <div class="space-y-2">
                <p class="text-xs font-semibold text-base-content/70 uppercase">Cards</p>
                {#each rule.cards as cardInfo (cardInfo.card.id)}
                  <div class="flex items-center justify-between bg-base-300 rounded p-2">
                    <div>
                      <p class="text-sm font-mono">{cardInfo.card.code || cardInfo.card.id}</p>
                      <p class="text-xs text-base-content/50">{cardInfo.card.card_definition_id}</p>
                    </div>
                    <span class="font-semibold">{formatNum(cardInfo.points)} pts</span>
                  </div>
                {/each}
              </div>
            {/if}

            {#if rule.incentives.length > 0}
              <div class="space-y-2 mt-3">
                <p class="text-xs font-semibold text-base-content/70 uppercase">Incentives</p>
                {#each rule.incentives as incentive (incentive.id)}
                  <div class="flex items-center gap-2 bg-base-300 rounded p-2">
                    <div class="badge badge-sm badge-success">{incentive.type}</div>
                    <p class="text-sm">{incentive.name || incentive.id}</p>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <!-- Group by Card View -->
      <div class="space-y-4">
        {#each byCard() as cardData (cardData.card.id)}
          <div class="bg-base-200 rounded-xl p-4">
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-bold font-mono">{cardData.card.code || cardData.card.id}</h4>
                <p class="text-xs text-base-content/50">{cardData.card.card_definition_id}</p>
              </div>
              <div class="badge badge-lg badge-primary">{formatNum(cardData.totalPoints)} pts</div>
            </div>

            {#if cardData.earningRules.length > 0}
              <div class="space-y-2">
                <p class="text-xs font-semibold text-base-content/70 uppercase">Earning Rules</p>
                {#each cardData.earningRules as erInfo (erInfo.id)}
                  <div class="flex items-center justify-between bg-base-300 rounded p-2">
                    <p class="text-sm">{erInfo.name}</p>
                    <span class="font-semibold">{formatNum(erInfo.points)} pts</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Incentives Summary -->
    {#if incentivesSummary().length > 0}
      <div class="bg-base-200 rounded-xl p-4">
        <h4 class="font-bold mb-3">Incentives Summary</h4>
        <div class="space-y-2">
          {#each incentivesSummary() as item (item.incentive.id)}
            <div class="bg-base-300 rounded p-3">
              <div class="flex items-center gap-2 mb-2">
                <div class="badge badge-sm badge-success">{item.incentive.type}</div>
                <p class="font-semibold">{item.incentive.name || item.incentive.id}</p>
              </div>
              <p class="text-xs text-base-content/60">
                From: {item.earningRules.join(', ')}
              </p>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Raw JSON Response -->
    <div class="bg-base-200 rounded-xl p-4">
      <button
        class="flex items-center justify-between w-full"
        onclick={() => (showJson = !showJson)}
      >
        <h4 class="font-bold">Raw JSON Response</h4>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 transition-transform {showJson ? 'rotate-180' : ''}"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {#if showJson}
        <pre class="mt-3 text-xs bg-base-300 rounded p-3 overflow-x-auto max-h-96 overflow-y-auto">{JSON.stringify(results, null, 2)}</pre>
      {/if}
    </div>
  </div>
{:else}
  <div class="text-center py-12 text-base-content/60">
    <p>No results to display</p>
    <p class="text-sm text-base-content/40 mt-2">Run an examination to see earning possibilities</p>
  </div>
{/if}
