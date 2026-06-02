<script>
  let { programName = '', onClose = null } = $props();
</script>

{#if programName}
  <div class="alert bg-info/10 border-info/30 border-l-4 border-l-info flex items-center gap-3 py-2.5 px-4 mb-4 rounded-lg">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-info shrink-0">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
    <div class="flex-1 text-sm">
      <span class="font-semibold">Assignment Mode Active</span>
      <span class="text-base-content/70 ml-2">
        Assigning to <span class="font-mono text-xs badge badge-sm badge-ghost">{programName}</span>
      </span>
      <span class="text-base-content/60 ml-1">— Toggle checkboxes to assign entities</span>
    </div>
    {#if onClose}
      <button class="btn btn-ghost btn-xs btn-circle" onclick={onClose} aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}
  </div>
{/if}
