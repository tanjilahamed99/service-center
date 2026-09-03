import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setAuth({ token, user }) {
        set({ token, user });
      },

      clearAuth() {
        set({ token: null, user: null });
      },

      isAuthenticated() {
        return !!get().token;
      },
    }),
    {
      name: "service-center-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────
export const selectToken = (s) => s.token;
export const selectUser = (s) => s.user;
export const selectIsAuthenticated = (s) => !!s.token;
