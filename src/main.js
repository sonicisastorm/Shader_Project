import { App } from './App.js';

const canvas = document.getElementById('c');

try {
  window.__app = new App(canvas);
  console.log('[ShaderProject] App started OK');
} catch (e) {
  console.error('[ShaderProject] Failed to start:', e);
}
