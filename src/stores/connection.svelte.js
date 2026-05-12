// Connection settings store with Svelte 5 runes
class ConnectionStore {
  baseUrl = $state(localStorage.getItem('vl_baseUrl') || 'http://localhost:8000');
  appId = $state(localStorage.getItem('vl_appId') || '');
  appToken = $state(localStorage.getItem('vl_appToken') || '');
  connected = $state(false);
  
  setBaseUrl(value) {
    this.baseUrl = value;
    localStorage.setItem('vl_baseUrl', value);
  }
  
  setAppId(value) {
    this.appId = value;
    localStorage.setItem('vl_appId', value);
  }
  
  setAppToken(value) {
    this.appToken = value;
    localStorage.setItem('vl_appToken', value);
  }
  
  setConnected(value) {
    this.connected = value;
  }
}

export const connection = new ConnectionStore();
