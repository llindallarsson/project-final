import { create } from "zustand";

const storageKey = "Vindra:token";

export const useAuth = create((set) => ({
  token:
    typeof window !== "undefined" ? localStorage.getItem(storageKey) : null,
  setToken: (t) => {
    if (t) localStorage.setItem(storageKey, t);
    else localStorage.removeItem(storageKey);
    set({ token: t });
  },
  logout: () => {
    localStorage.removeItem(storageKey);
    set({ token: null });
  },
}));
