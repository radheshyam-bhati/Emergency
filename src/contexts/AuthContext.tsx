import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface AuthError {
  message: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthProfile {
  email: string;
  fullName: string;
  role: "admin";
}

interface AuthResponse {
  error: AuthError | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: AuthProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin@123";
const STORAGE_KEY = "rapid-rescue-grid-auth";

const AuthContext = createContext<AuthContextType | null>(null);

const createAdminSession = (): { profile: AuthProfile; user: AuthUser } => ({
  user: {
    id: "local-admin",
    email: ADMIN_EMAIL,
  },
  profile: {
    email: ADMIN_EMAIL,
    fullName: "System Administrator",
    role: "admin",
  },
});

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (storedValue === ADMIN_EMAIL) {
      const adminSession = createAdminSession();
      setUser(adminSession.user);
      setProfile(adminSession.profile);
    }

    setLoading(false);
  }, []);

  async function signIn(email: string, password: string): Promise<AuthResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return {
        error: {
          message: "Use admin@gmail.com with password admin@123.",
        },
      };
    }

    const adminSession = createAdminSession();
    window.localStorage.setItem(STORAGE_KEY, ADMIN_EMAIL);
    setUser(adminSession.user);
    setProfile(adminSession.profile);

    return { error: null };
  }

  async function signOut() {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setProfile(null);
  }

  return <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}
