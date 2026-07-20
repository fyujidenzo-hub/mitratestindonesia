import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "./api";
import type { User } from "../types";

type AuthValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<User | null>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const result = await api<{ user: User }>("/auth/me");
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

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    refresh,
    setUser,
    logout: async () => {
      await api("/auth/logout", { method: "POST" });
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
