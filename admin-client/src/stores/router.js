import { writable } from 'svelte/store';

const initial = {};

const { set, subscribe } = writable(initial);

export const currentPage = writable(null);

export default {
  setContext: (ctx) => set({ ...ctx }),
  subscribe,
};
