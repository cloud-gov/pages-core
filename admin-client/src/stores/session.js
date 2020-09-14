import { writable } from 'svelte/store';

const initial = {
  authenticated: false,
  user: null,
};

const { set, subscribe, update } = writable(initial);

export default {
  login: (user) => set({ authenticated: true, user }),
  logout: () => set(initial),
  updateUser: (user) => update((s) => ({ ...s, user })),
  subscribe,
};
