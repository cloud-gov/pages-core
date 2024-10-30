import { get, writable } from 'svelte/store';

const initial = {
  authenticated: false,
  csrfToken: null,
  user: null,
};

const store = writable(initial);
const { set, subscribe, update } = store;

export default {
  csrfToken: () => get(store).csrfToken,
  login: ({ csrfToken, ...user }) =>
    set({
      authenticated: true,
      csrfToken,
      user,
    }),
  logout: () => set(initial),
  updateUser: ({ csrfToken, ...user }) =>
    update((s) => ({
      ...s,
      csrfToken,
      user,
    })),
  subscribe,
};
