// API request/response log store with Svelte 5 runes
class ApiLogStore {
  logs = $state([]);
  
  add(entry) {
    this.logs = [entry, ...this.logs];
  }
  
  clear() {
    this.logs = [];
  }
  
  get all() {
    return this.logs;
  }
}

export const apiLog = new ApiLogStore();
