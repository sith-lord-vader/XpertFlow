/*global chrome*/
/**
 * A tiny “storage” object that has the same surface for both
 * normal pages and chrome extensions.
 */
const storage = (() => {
  const hasChrome =
    typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

  if (hasChrome) {
    return {
      get(key) {
        return new Promise((resolve) => {
          chrome.storage.local.get(key, (items) => resolve(items));
        });
      },
      set(items) {
        return new Promise((resolve) => {
          chrome.storage.local.set(items, () => resolve());
        });
      },
      remove(key) {
        return new Promise((resolve) => {
          chrome.storage.local.remove(key, () => resolve());
        });
      },
      clear() {
        return new Promise((resolve) => {
          chrome.storage.local.clear(() => resolve());
        });
      },
    };
  } else if (typeof window !== "undefined" && window.localStorage) {
    return {
      get(key) {
        return new Promise((resolve) => {
          if (typeof key === "string") {
            resolve(window.localStorage.getItem(key));
          } else if (Array.isArray(key)) {
            const obj = {};
            key.forEach((k) => (obj[k] = window.localStorage.getItem(k)));
            resolve(obj);
          } else {
            // object with defaults
            const obj = {};
            Object.keys(key).forEach((k) => {
              const v = window.localStorage.getItem(k);
              obj[k] = v === null ? key[k] : v;
            });
            resolve(obj);
          }
        });
      },
      set(items) {
        return new Promise((resolve) => {
          Object.entries(items).forEach(([k, v]) =>
            window.localStorage.setItem(k, String(v)),
          );
          resolve();
        });
      },
      remove(key) {
        return new Promise((resolve) => {
          if (typeof key === "string") {
            window.localStorage.removeItem(key);
          } else {
            key.forEach((k) => window.localStorage.removeItem(k));
          }
          resolve();
        });
      },
      clear() {
        return new Promise((resolve) => {
          window.localStorage.clear();
          resolve();
        });
      },
    };
  } else {
    throw new Error("No supported storage available");
  }
})();

export default storage;
