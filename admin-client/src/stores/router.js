import { writable } from 'svelte/store';

const initial = {};

const { set, subscribe } = writable(initial);

export default {
  setContext: ({ page, ...rest }) => set(rest),
  subscribe,
};
