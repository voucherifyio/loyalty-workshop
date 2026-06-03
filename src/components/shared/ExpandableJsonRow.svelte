<script>
  let {
    data = null,
    colspan = 1,
    expanded = false
  } = $props();
</script>

{#if expanded}
  <tr>
    <td colspan={colspan} class="bg-base-300">
      <pre class="text-[9px] p-2 overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
    </td>
  </tr>
{/if}
