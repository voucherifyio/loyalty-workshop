import './app.css';
import 'notyf/notyf.min.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { theme } from './stores/theme.svelte.js';

// Initialize theme immediately
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', theme.current);
}

mount(App, {
  target: document.getElementById('app')
});
