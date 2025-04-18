import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserResponseModel } from "@kitejs-cms/core/index";
import { useApi } from "../hooks/use-api";

interface AuthContextType {
  user: UserResponseModel | null;
  setUser: React.Dispatch<React.SetStateAction<UserResponseModel | null>>;
  login: (
    email: string,
    password: string
  ) => Promise<{ data: UserResponseModel | null; error: unknown | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchData } = useApi<UserResponseModel>();

  const [user, setUser] = useState<UserResponseModel | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await fetchData("auth/profile", "GET");

      if (data) {
        setUser(data);
      } else {
        navigate("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const login = async (email: string, password: string) => {
    const { data, error } = await fetchData("auth/login", "POST", {
      email,
      password,
    });

    if (data) {
      const { data: userData } = await fetchData("auth/profile", "GET");
      if (userData) setUser(userData);

      navigate("/");
      return { data: null, error };
    } else {
      return { error, data: null };
    }
  };

  const logout = async () => {
    await fetchData("auth/logout", "DELETE");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
