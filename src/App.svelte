<script>
  import TopBar from './components/TopBar.svelte';
  import ApiInspector from './components/ApiInspector.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import Designer from './views/Designer.svelte';

  let settingsModalOpen = $state(false);
  let designerActions = $state(null);
</script>

<div class="min-h-screen bg-base-100 flex flex-col">
  <TopBar {designerActions} onOpenSettings={() => settingsModalOpen = true} />
  
  <!-- Main content area with view switching -->
  <div class="flex-1 pb-16">
    <Designer bind:designerActions />
  </div>
  
  <ApiInspector />
  <SettingsModal open={settingsModalOpen} onClose={() => settingsModalOpen = false} />
</div>
