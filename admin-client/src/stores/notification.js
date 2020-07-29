import { writable } from 'svelte/store';

const initial = {
  type: null,
  message: '',
};

const { set, subscribe } = writable(initial);

export default {
  clear: () => set(initial),
  setError: message => set({ message, type: 'error' }),
  setInfo: message => set({ message, type: 'info' }),
  setSuccess: message => set({ message, type: 'success' }),
  setWarning: message => set({ message, type: 'warning' }),
  subscribe,
};
