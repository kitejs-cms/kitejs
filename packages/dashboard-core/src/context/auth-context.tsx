import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { UserResponseModel } from "@kitejs/core/index";
import { useApi } from "../hooks/use-api";

interface AuthContextType {
  user: UserResponseModel | null;
  login: (email: string, password: string) => Promise<void>;
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
      navigate("/");
    } else {
      console.error(error);
    }
  };

  const logout = async () => {
    await fetchData("auth/logout", "DELETE");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve essere usato all'interno di AuthProvider");
  }
  return context;
}
