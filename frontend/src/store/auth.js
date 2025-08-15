import { create } from "zustand";

export const useAuth = create((set, get) => ({
  token: null,
  setToken: (t) => set({ token: t }),
  logout: () => set({ token: null }),
}));
