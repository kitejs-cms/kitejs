import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import type {
  UserResponseModel,
  RoleResponseModel,
} from "@kitejs-cms/core/index";
import { useApi } from "../hooks/use-api";

interface AuthContextType {
  user: UserResponseModel | null;
  roles: RoleResponseModel[];
  permissions: Set<string>;
  initializing: boolean;
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
  const { fetchData: fetchRoles } = useApi<RoleResponseModel[]>();

  const [user, setUser] = useState<UserResponseModel | null>(null);
  const [roles, setRoles] = useState<RoleResponseModel[]>([]);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();

  const permissions = useMemo(() => {
    const userPermissions = user?.permissions ?? [];
    const rolePermissions = roles
      .filter((role) => user?.roles.includes(role.name))
      .flatMap((role) => role.permissions);
    return new Set([...userPermissions, ...rolePermissions]);
  }, [user, roles]);

  useEffect(() => {
    (async () => {
      const { data } = await fetchData("auth/profile", "GET");

      if (data) {
        setUser(data);
        const { data: rolesData } = await fetchRoles("roles", "GET");
        setRoles(rolesData ?? []);
      } else {
        navigate("/login");
      }
      setInitializing(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, fetchRoles]);

  const login = async (email: string, password: string) => {
    const { data, error } = await fetchData("auth/login", "POST", {
      email,
      password,
    });

    if (data) {
      const { data: userData } = await fetchData("auth/profile", "GET");
      if (userData) {
        setUser(userData);
        const { data: rolesData } = await fetchRoles("roles", "GET");
        setRoles(rolesData ?? []);
      }

      navigate("/");
      return { data: null, error };
    } else {
      return { error, data: null };
    }
  };

  const logout = async () => {
    await fetchData("auth/logout", "DELETE");
    setUser(null);
    setRoles([]);
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, roles, permissions, initializing, login, logout, setUser }}
    >
      {!initializing && children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      roles: [],
      permissions: new Set<string>(),
      initializing: false,
      login: async () => ({ data: null, error: null }),
      logout: () => {},
      setUser: () => {},
    };
  }
  return context;
}
