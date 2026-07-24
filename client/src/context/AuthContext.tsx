import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "@/api";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("shopx_user");
      const storedToken = localStorage.getItem("shopx_access_token");

      if (storedUser && storedUser !== "undefined" && storedToken) {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
      } else if (storedUser === "undefined") {
        localStorage.removeItem("shopx_user");
        localStorage.removeItem("shopx_access_token");
        localStorage.removeItem("shopx_refresh_token");
      }
    } catch (error) {
      console.error("Failed to restore auth session:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (tokens: { accessToken: string; refreshToken: string }, userData: User) => {
    setUser(userData);
    setAccessToken(tokens.accessToken);
    localStorage.setItem("shopx_access_token", tokens.accessToken);
    localStorage.setItem("shopx_refresh_token", tokens.refreshToken);
    localStorage.setItem("shopx_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem("shopx_access_token");
    localStorage.removeItem("shopx_refresh_token");
    localStorage.removeItem("shopx_user");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
