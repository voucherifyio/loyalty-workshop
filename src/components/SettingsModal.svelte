<script lang="js">
  import BaseModal from './shared/BaseModal.svelte';
  import ModalHeader from './shared/ModalHeader.svelte';
  import { api } from "../api/client.js";
  import { endpoints } from "../api/endpoints.js";
  import { connection } from "../stores/connection.svelte.js";

  let {
    open = false,
    onClose = () => {},
  } = $props();

  let testing = $state(false);
  let testResult = $state(null);

  async function testConnection() {
    testing = true;
    testResult = null;
    try {
      await api.get(endpoints.ping());
      connection.setConnected(true);
      testResult = { success: true, message: "Connection successful!" };
    } catch (error) {
      connection.setConnected(false);
      testResult = {
        success: false,
        message: error.message || "Connection failed",
      };
    } finally {
      testing = false;
    }
  }

  function handleClose() {
    onClose();
  }
</script>

<BaseModal {open} size="md" onClose={handleClose}>
  <ModalHeader title="Connection Settings" onClose={handleClose} />

  <div class="space-y-4">
    <!-- Base URL -->
    <div class="form-control">
      <label class="label" for="base-url">
        <span class="label-text">Base URL</span>
      </label>
      <input
        id="base-url"
        type="text"
        class="input input-bordered w-full"
        placeholder="http://localhost:8000"
        bind:value={connection.baseUrl}
        oninput={(e) => connection.setBaseUrl(e.target.value)}
      />
    </div>

    <!-- App ID -->
    <div class="form-control">
      <label class="label" for="app-id">
        <span class="label-text">App ID</span>
      </label>
      <input
        id="app-id"
        type="text"
        class="input input-bordered w-full"
        placeholder="Enter your App ID"
        bind:value={connection.appId}
        oninput={(e) => connection.setAppId(e.target.value)}
      />
    </div>

    <!-- App Token -->
    <div class="form-control">
      <label class="label" for="app-token">
        <span class="label-text">App Token</span>
      </label>
      <input
        id="app-token"
        type="password"
        class="input input-bordered w-full"
        placeholder="Enter your App Token"
        bind:value={connection.appToken}
        oninput={(e) => connection.setAppToken(e.target.value)}
      />
    </div>

    <!-- Test Connection Button -->
    <div class="form-control">
      <button
        class="btn btn-primary w-full"
        onclick={testConnection}
        disabled={testing}
      >
        {testing ? "Testing Connection..." : "Test Connection"}
      </button>

      {#if testResult}
        <div
          class="alert {testResult.success
            ? 'alert-success'
            : 'alert-error'} mt-2"
        >
          <span>{testResult.message}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="modal-action">
    <button type="button" class="btn" onclick={handleClose}>
      Close
    </button>
  </div>
</BaseModal>
