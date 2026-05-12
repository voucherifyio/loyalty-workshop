<script>
  let { status } = $props();
  
  function getStatusClass(status) {
    const s = status?.toUpperCase();
    if (s === 'ACTIVE') return 'badge-success';
    if (s === 'INACTIVE') return 'badge-error';
    if (s === 'DRAFT') return 'badge-warning';
    if (s === 'DELETED') return 'badge-ghost';
    return 'badge-neutral';
  }
</script>

<span class="badge badge-xs {getStatusClass(status)}">
  {status || 'UNKNOWN'}
</span>
