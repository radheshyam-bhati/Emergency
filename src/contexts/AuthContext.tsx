import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, login, signUp as apiSignUp } from "@/api/auth";
import type { AuthSession, AuthUser } from "@/types/domain";

export interface AuthError {
  message: string;
}

export interface AuthProfile {
  email: string;
  fullName: string;
  role: "admin" | "dispatcher";
}

interface AuthResponse {
  error: AuthError | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: AuthProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const TOKEN_KEY = "rapid-rescue-grid-token";
const SESSION_KEY = "rapid-rescue-grid-session";

const AuthContext = createContext<AuthContextType | null>(null);

const toProfile = (user: AuthUser): AuthProfile => ({
  email: user.email,
  fullName: user.fullName,
  role: user.role,
});

const persistSession = (session: AuthSession) => {
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session.user));
};

const clearSession = () => {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
};

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
    const handleUnauthorized = () => {
      clearSession();
      setUser(null);
      setProfile(null);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    const storedSession = window.localStorage.getItem(SESSION_KEY);
    const token = window.localStorage.getItem(TOKEN_KEY);

    if (!storedSession || !token) {
      setLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedSession) as AuthUser;
      setUser(parsedUser);
      setProfile(toProfile(parsedUser));

      getCurrentUser()
        .then(({ user: currentUser }) => {
          setUser(currentUser);
          setProfile(toProfile(currentUser));
          window.localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        })
        .catch(() => {
          clearSession();
          setUser(null);
          setProfile(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch {
      clearSession();
      setLoading(false);
    }
  }, []);

  async function signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const session = await login(email, password);
      persistSession(session);
      setUser(session.user);
      setProfile(toProfile(session.user));
      return { error: null };
    } catch (error) {
      clearSession();
      return {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Unable to sign in with the provided credentials.",
        },
      };
    }
  }

  async function signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
    try {
      const session = await apiSignUp(email, password, fullName);
      persistSession(session);
      setUser(session.user);
      setProfile(toProfile(session.user));
      return { error: null };
    } catch (error) {
      clearSession();
      return {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Unable to sign up with the provided details.",
        },
      };
    }
  }

  async function signOut() {
    clearSession();
    setUser(null);
    setProfile(null);
  }

  return <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}
