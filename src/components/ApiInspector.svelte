<script>
  import { apiLog } from '../stores/api-log.svelte.js';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  let isOpen = $state(false);
  let expandedId = $state(null);
  let relativeTime = $state({});
  let previousCount = $state(0);
  let isShaking = $state(false);
  let lastSeenCount = $state(0);
  let searchQuery = $state('');
  let deltaCount = $state(0);
  let deltaTimer = null;
  
  // Filtered logs based on search query
  let filteredLogs = $derived.by(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 3) return apiLog.all;
    return apiLog.all.filter(log => {
      const haystack = [
        log.url,
        JSON.stringify(log.request),
        JSON.stringify(log.response),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  });
  
  // Watch for new API calls and trigger shake animation
  $effect(() => {
    if (apiLog.all.length > previousCount && previousCount > 0) {
      isShaking = true;
      setTimeout(() => {
        isShaking = false;
      }, 500);
      
      // Track delta count when drawer is closed
      if (!isOpen) {
        const newCalls = apiLog.all.length - previousCount;
        deltaCount += newCalls;
        
        // Reset timer - clear after 3 seconds
        if (deltaTimer) clearTimeout(deltaTimer);
        deltaTimer = setTimeout(() => {
          deltaCount = 0;
        }, 3000);
      }
    }
    previousCount = apiLog.all.length;
  });
  
  function toggleDrawer() {
    isOpen = !isOpen;
    // Mark all current logs as seen when opening
    if (isOpen) {
      lastSeenCount = apiLog.all.length;
      deltaCount = 0;
      if (deltaTimer) clearTimeout(deltaTimer);
    }
  }
  
  function isNewLog(log) {
    const indexInAll = apiLog.all.indexOf(log);
    return indexInAll >= 0 && indexInAll < (apiLog.all.length - lastSeenCount);
  }
  
  function toggleExpand(id) {
    expandedId = expandedId === id ? null : id;
  }
  
  function copyAsCurl(log) {
    const headers = Object.entries(log.request.headers)
      .map(([k, v]) => `-H "${k}: ${v}"`)
      .join(' ');
    
    const body = log.request.body 
      ? `-d '${JSON.stringify(log.request.body)}'`
      : '';
    
    const curl = `curl -X ${log.method} ${log.url} ${headers} ${body}`;
    navigator.clipboard.writeText(curl);
  }
  
  function getStatusColor(status) {
    if (!status) return 'badge-ghost';
    if (status >= 200 && status < 300) return 'badge-success';
    if (status >= 400 && status < 500) return 'badge-warning';
    if (status >= 500) return 'badge-error';
    return 'badge-ghost';
  }
  
  function getRelativeTime(timestamp) {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    
    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${Math.floor(diffHour / 24)}d ago`;
  }
  
  function maskSensitiveHeaders(headers) {
    const masked = { ...headers };
    const sensitiveKeys = ['X-App-Token', 'x-app-token', 'Authorization', 'authorization'];
    
    sensitiveKeys.forEach(key => {
      if (masked[key]) {
        masked[key] = '***HIDDEN***';
      }
    });
    
    return masked;
  }
  
  function getQueryParams(url) {
    try {
      const urlObj = new URL(url);
      const params = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      return Object.keys(params).length > 0 ? params : null;
    } catch {
      return null;
    }
  }
  
  function updateRelativeTimes() {
    const newTimes = {};
    apiLog.all.forEach(log => {
      newTimes[log.id] = getRelativeTime(log.timestamp);
    });
    // Reassign to trigger Svelte 5 reactivity
    relativeTime = { ...newTimes };
  }
  
  let timeInterval;
  onMount(() => {
    updateRelativeTimes();
    timeInterval = setInterval(updateRelativeTimes, 1000);
    
    return () => {
      if (timeInterval) {
        clearInterval(timeInterval);
      }
    };
  });
</script>

<!-- Toggle Button (FAB style) -->
<div class="fixed bottom-4 left-4 z-50">
  <button 
    class="btn btn-circle btn-primary shadow-lg w-14 h-14 {isShaking ? 'animate-shake' : ''} relative"
    onclick={toggleDrawer}
    title="API call log"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
    {#if apiLog.total > 0}
      <span class="badge badge-sm badge-primary absolute -top-1 -right-1" title="Total API calls">{apiLog.total}</span>
    {/if}
  </button>
  
  <!-- Transient delta badge -->
  {#if deltaCount > 0}
    <div class="absolute -top-2 left-16" transition:fade>
      <span class="badge badge-accent">+{deltaCount}</span>
    </div>
  {/if}
</div>

<!-- Drawer Panel -->
{#if isOpen}
  <div class="fixed top-0 left-0 bottom-0 z-40 bg-base-200 border-r border-base-300 w-1/2 overflow-y-auto shadow-2xl">
    <div class="flex justify-between items-center p-2 sticky top-0 bg-base-200 border-b border-base-300 z-10">
      <h3 class="font-bold">API Call Log ({apiLog.all.length})</h3>
      <button class="btn btn-xs btn-ghost" onclick={() => apiLog.clear()}>Clear</button>
    </div>
    
    <!-- Search Bar -->
    <div class="p-2 bg-base-200 sticky top-[49px] z-10 border-b border-base-300">
      <input 
        type="text" 
        placeholder="Search (min 3 chars)..." 
        class="input input-sm input-bordered w-full"
        bind:value={searchQuery}
      />
    </div>
    
    <div class="p-2 space-y-2">
      {#each filteredLogs as log, index (log.id)}
        <div class="collapse collapse-arrow bg-base-100 shadow-sm {isNewLog(log) ? 'ring-2 ring-primary' : ''}">
          <input type="checkbox" checked={expandedId === log.id} onchange={() => toggleExpand(log.id)} />
          <div class="collapse-title text-sm font-medium">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                {#if isNewLog(log)}
                  <span class="badge badge-xs badge-primary">New</span>
                {/if}
                <span class="badge badge-sm {getStatusColor(log.status)}">{log.status || 'ERR'}</span>
                <span class="badge badge-sm badge-ghost">{log.method}</span>
                <span class="badge badge-sm badge-outline">{log.duration}ms</span>
                <span class="text-xs text-base-content/50">{relativeTime[log.id] || ''}</span>
              </div>
              <div class="text-xs break-all whitespace-normal">{log.path}</div>
            </div>
          </div>
          <div class="collapse-content">
            <div class="space-y-2">
              <!-- Request Info -->
              <div>
                <div class="font-bold mb-1">Request Info:</div>
                <div class="card bg-base-200">
                  <div class="card-body p-4">
                    <div><strong>URL:</strong> {log.url}</div>
                    <div><strong>Headers:</strong></div>
                    <pre class="text-xs overflow-x-auto">{JSON.stringify(maskSensitiveHeaders(log.request.headers), null, 2)}</pre>
                  </div>
                </div>
              </div>
              
              <!-- Query Parameters -->
              <div>
                <div class="font-bold mb-1">Query Parameters:</div>
                <div class="card bg-base-200">
                  <div class="card-body p-4">
                    {#if getQueryParams(log.url)}
                      <div class="flex flex-wrap gap-2">
                        {#each Object.entries(getQueryParams(log.url)) as [key, value] (key)}
                          <div class="badge badge-lg badge-outline gap-2">
                            <span class="font-semibold">{key}:</span>
                            <span class="font-mono">{value}</span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <span class="text-xs text-base-content/50">No query parameters</span>
                    {/if}
                  </div>
                </div>
              </div>
              
              <!-- Request/Response Bodies in Two Columns -->
              <div class="grid grid-cols-2 gap-4">
                <!-- Request Body -->
                <div>
                  <div class="font-bold mb-1">Request Body:</div>
                  <div class="card bg-base-200">
                    <div class="card-body p-4">
                      {#if log.request.body}
                        <pre class="text-xs overflow-x-auto">{JSON.stringify(log.request.body, null, 2)}</pre>
                      {:else}
                        <span class="text-base-content/50">No request body</span>
                      {/if}
                    </div>
                  </div>
                </div>
                
                <!-- Response Body -->
                <div>
                  <div class="font-bold mb-1">Response Body:</div>
                  <div class="card bg-base-200">
                    <div class="card-body p-4">
                      <pre class="text-xs overflow-x-auto">{JSON.stringify(log.response.body, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Copy as cURL -->
              <button 
                class="btn btn-xs btn-outline"
                onclick={() => copyAsCurl(log)}
              >
                Copy as cURL
              </button>
            </div>
          </div>
        </div>
      {/each}
      
      {#if apiLog.all.length === 0}
        <div class="text-center text-sm text-base-content/50 py-8">
          No API calls yet. Make a request to see logs here.
        </div>
      {:else if filteredLogs.length === 0}
        <div class="text-center text-sm text-base-content/50 py-8">
          No API calls match your search.
        </div>
      {/if}
    </div>
  </div>
{/if}
