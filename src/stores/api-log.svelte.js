// API request/response log store with Svelte 5 runes
class ApiLogStore {
  logs = $state([]);
  totalCount = $state(0);
  
  add(entry) {
    this.logs = [entry, ...this.logs];
    this.totalCount++;
  }
  
  clear() {
    this.logs = [];
  }
  
  get all() {
    return this.logs;
  }
  
  get total() {
    return this.totalCount;
  }
}

export const apiLog = new ApiLogStore();
