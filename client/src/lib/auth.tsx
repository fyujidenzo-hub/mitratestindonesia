import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "./api";
import type { User } from "../types";

type SessionArea = "customer" | "admin";

type AuthValue = {
  user: User | null;
  loading: boolean;
  refresh: (area?: SessionArea) => Promise<User | null>;
  setUser: (user: User | null) => void;
  logout: (area?: SessionArea) => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

function currentSessionArea(): SessionArea {
  return window.location.pathname.startsWith("/admin") ? "admin" : "customer";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async (area: SessionArea = currentSessionArea()) => {
    try {
      const result = await api<{ user: User }>(`/auth/me?area=${area}`);
      setUser(result.user);
      return result.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (user?.role !== "CUSTOMER") return;

    const heartbeat = () => {
      if (document.visibilityState === "visible") {
        void api("/customer/session/heartbeat", { method: "POST" }).catch(() => undefined);
      }
    };
    const onVisibilityChange = () => heartbeat();

    heartbeat();
    const interval = window.setInterval(heartbeat, 15_000);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", heartbeat);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", heartbeat);
    };
  }, [user?.id, user?.role]);

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    refresh,
    setUser,
    logout: async (area: SessionArea = currentSessionArea()) => {
      if (area === "customer" && user?.role === "CUSTOMER") {
        await api("/customer/session/offline", { method: "POST" }).catch(() => undefined);
      }
      await api("/auth/logout", { method: "POST", body: JSON.stringify({ area }) });
      setUser(null);
    },
  }), [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
