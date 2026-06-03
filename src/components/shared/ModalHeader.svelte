<script>
  let {
    title = '',
    subtitle = '',
    onClose = () => {},
    disabled = false
  } = $props();
</script>

<div class="flex items-center justify-between mb-4">
  <div>
    <h3 class="font-bold text-lg">{title}</h3>
    {#if subtitle}
      <p class="text-sm text-base-content/60 mt-1">{subtitle}</p>
    {/if}
  </div>
  <button
    class="btn btn-sm btn-circle btn-ghost"
    onclick={onClose}
    {disabled}
    aria-label="Close modal"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>
