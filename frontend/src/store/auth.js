import { create } from "zustand";
import { api } from "../api";

const storageKey = "Vindra:token";

export const useAuth = create((set, get) => ({
  token:
    typeof window !== "undefined" ? localStorage.getItem(storageKey) : null,
  user: null,
  loading: false,
  error: "",

  setToken: (t) => {
    if (t) localStorage.setItem(storageKey, t);
    else localStorage.removeItem(storageKey);
    set({ token: t });
  },

  // Fetch current user from BE (/api/auth/me)
  hydrate: async () => {
    const token = get().token;
    if (!token) {
      set({ user: null });
      return;
    }
    try {
      set({ loading: true, error: "" });
      const me = await api("/api/auth/me", { token }); // <-- viktigt: /api/auth/me
      set({ user: me });
    } catch (e) {
      // Ogiltig/expired token -> rensa
      localStorage.removeItem(storageKey);
      set({ token: null, user: null, error: e.message || "Auth failed" });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ loading: true, error: "" });
      const { token } = await api("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      get().setToken(token);
      await get().hydrate();
      return true;
    } catch (e) {
      set({ error: e.message || "Login failed" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  signup: async (email, password) => {
    try {
      set({ loading: true, error: "" });
      const { token } = await api("/api/auth/signup", {
        method: "POST",
        body: { email, password },
      });
      get().setToken(token);
      await get().hydrate();
      return true;
    } catch (e) {
      set({ error: e.message || "Signup failed" });
      return false;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    localStorage.removeItem(storageKey);
    set({ token: null, user: null, error: "" });
  },
}));
