import { get, writable } from 'svelte/store';

const defaultNotification = {
  type: null,
  message: '',
};

function storeNotification() {
  const storeName = 'notification';
  const notificationTypes = ['error', 'info', 'success', 'warning'];

  const store = writable(defaultNotification);
  const { set, subscribe } = store;

  const setNotification = ({ message, type }) => set({
    message,
    type: notificationTypes.includes(type) ? type : 'info',
  });

  return {
    clear: () => set(defaultNotification),
    get: () => get(store),
    setError: message => setNotification({ message, type: 'error' }),
    setInfo: message => setNotification({ message, type: 'info' }),
    setNotification,
    setSuccess: message => setNotification({ message, type: 'success' }),
    setWarning: message => setNotification({ message, type: 'warning' }),
    storeName,
    subscribe,
  };
}

export const notification = storeNotification();

export default {
  notification,
};
