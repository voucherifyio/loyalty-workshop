// Theme store with Svelte 5 runes
class ThemeStore {
  current = $state(localStorage.getItem('vl_theme') || 'light');
  
  setCurrent(value) {
    this.current = value;
    localStorage.setItem('vl_theme', value);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', value);
    }
  }
}

export const theme = new ThemeStore();

// Initialize theme on load
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', theme.current);
}
