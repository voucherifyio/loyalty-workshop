<script>
  import Router from 'svelte-spa-router';
  import TopBar from './components/TopBar.svelte';
  import ApiInspector from './components/ApiInspector.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import CustomerLookupModal from './components/CustomerLookupModal.svelte';
  import Designer from './views/Designer.svelte';
  import ProgramDetailPage from './views/ProgramDetailPage.svelte';
  import MemberDetailPage from './views/MemberDetailPage.svelte';
  import { getDesignerActions } from './stores/designerActions.svelte.js';

  let settingsModalOpen = $state(false);
  let customerLookupOpen = $state(false);
  const designerActions = $derived(getDesignerActions());

  const routes = {
    '/': Designer,
    '/programs/:programId': ProgramDetailPage,
    '/programs/:programId/members/:memberId': MemberDetailPage,
  };
</script>

<div class="min-h-screen bg-base-100 flex flex-col">
  <TopBar
    {designerActions}
    onOpenSettings={() => settingsModalOpen = true}
    onOpenCustomerLookup={() => customerLookupOpen = true}
  />
  
  <!-- Main content area with view switching -->
  <div class="flex-1 pb-16">
    <Router {routes} restoreScrollState={true} />
  </div>
  
  <ApiInspector />
  <SettingsModal open={settingsModalOpen} onClose={() => settingsModalOpen = false} />
  <CustomerLookupModal open={customerLookupOpen} onClose={() => customerLookupOpen = false} />
</div>
