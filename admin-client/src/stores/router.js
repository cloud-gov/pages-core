import { writable } from 'svelte/store';

const initial = {};

const { set, subscribe } = writable(initial);

export default {
  setContext: ({ _, ...rest }) => set(rest),
  subscribe,
};
