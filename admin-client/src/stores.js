import { get, writable } from "svelte/store";

function checkLocalStorage(storeName) {
  return (store) => {
    let localStore;
    try {
      const localStoreItem = window.localStorage.getItem(storeName);
      localStore = localStoreItem
        ? JSON.parse(window.localStorage.getItem(storeName))
        : store;
    } catch {
      localStore = store;
    }

    return localStore;
  };
}

const defaultUser = {
  token: null,
  isAuthenticated: false,
};

function storeUser() {
  const storeName = "user";

  const store = writable(defaultUser);
  const { subscribe, update } = store;

  return {
    checkLocalStorage: () => update(checkLocalStorage(storeName)),
    get: () => get(store),
    logout: () => update(() => defaultUser),
    setCurrentUserToken: ({ token }) =>
      update((u) => {
        return Object.assign(u, { token, isAuthenticated: true });
      }),
    storeName,
    subscribe,
  };
}

export const user = storeUser();

const defaultNotification = {
  type: null,
  message: "",
};

function storeNotification() {
  const storeName = "notification";
  const notificationTypes = ["error", "info", "success", "warning"];

  const store = writable(defaultNotification);
  const { set, subscribe } = store;

  const setNotification = ({ message, type }) => {
    type = notificationTypes.includes(type) ? type : "info";
    return set({ message, type });
  };

  return {
    clear: () => set(defaultNotification),
    get: () => get(store),
    setError: (message) => setNotification({ message, type: "error" }),
    setInfo: (message) => setNotification({ message, type: "info" }),
    setNotification,
    setSuccess: (message) => setNotification({ message, type: "success" }),
    setWarning: (message) => setNotification({ message, type: "warning" }),
    storeName,
    subscribe,
  };
}

export const notification = storeNotification();
