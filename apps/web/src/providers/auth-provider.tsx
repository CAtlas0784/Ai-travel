import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (payload: { username: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEMO_TOKEN = "demo-preview-token";
const DEMO_USER = {
  id: "demo-user",
  username: "Uthai Explorer",
  email: "preview@uthai.local",
  avatarUrl: null
};

function readStoredToken() {
  if (import.meta.env.VITE_DEMO_MODE !== "false") {
    return DEMO_TOKEN;
  }
  return readStoredTokenFromBrowser();
}

function readStoredTokenFromBrowser() {
  return localStorage.getItem("uthai_token") ?? sessionStorage.getItem("uthai_token");
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<User | null>(() => (token === DEMO_TOKEN ? DEMO_USER : null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || token === DEMO_TOKEN) {
      if (token === DEMO_TOKEN) setUser(DEMO_USER);
      setLoading(false);
      return;
    }

    api
      .me(token)
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem("uthai_token");
        sessionStorage.removeItem("uthai_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      async login(email, password, remember) {
        const result = await api.login({ email, password });
        const storage = remember ? localStorage : sessionStorage;
        localStorage.removeItem("uthai_token");
        sessionStorage.removeItem("uthai_token");
        storage.setItem("uthai_token", result.token);
        setToken(result.token);
        setUser(result.user);
      },
      async register(payload) {
        const result = await api.register(payload);
        localStorage.setItem("uthai_token", result.token);
        setToken(result.token);
        setUser(result.user);
      },
      logout() {
        localStorage.removeItem("uthai_token");
        sessionStorage.removeItem("uthai_token");
        setToken(null);
        setUser(null);
      }
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
