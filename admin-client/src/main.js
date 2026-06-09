import App from './App.svelte';
import { init } from './lib/auth';
import { initRouter } from './router';

init();
initRouter();

const app = new App({
  target: document.body,
});

export default app;
