import App from './App.svelte';
import { init } from './lib/auth';

init();

const app = new App({
  target: document.body,
});

export default app;
