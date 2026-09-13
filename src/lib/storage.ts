/**
 * Safe wrapper around localStorage and sessionStorage to prevent
 * DOMException / SecurityError crashes in restricted browser contexts
 * (e.g. Chrome incognito, third-party iframe, or disabled cookies).
 */

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch {}
  },

  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch {}
  },

  getSession: (key: string): string | null => {
    try {
      if (typeof window === "undefined" || !window.sessionStorage) return null;
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setSession: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem(key, value);
      }
    } catch {}
  },

  removeSession: (key: string): void => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.removeItem(key);
      }
    } catch {}
  },
};
