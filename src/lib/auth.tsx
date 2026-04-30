import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, session, type User } from "./api";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAuthed: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!session.hasToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      session.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    const onStorage = () => void refresh();
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
    return () => {
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  }, []);

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, isAuthed: !!user, refresh, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}