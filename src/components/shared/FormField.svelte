<script>
  let {
    label = '',
    hint = '',
    required = false,
    for: htmlFor = '',
    children
  } = $props();
</script>

<div class="form-control">
  {#if label}
    <label class="label" for={htmlFor}>
      <span class="label-text font-medium">
        {label}
        {#if required}
          <span class="text-error">*</span>
        {/if}
      </span>
      {#if hint}
        <span class="label-text-alt text-base-content/50">{hint}</span>
      {/if}
    </label>
  {/if}
  {@render children()}
</div>
