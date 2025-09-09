import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import type {
  UserResponseModel,
  RoleResponseModel,
} from "@kitejs-cms/core/index";
import { useApi } from "../hooks/use-api";
import { useLoading } from "./loading-context";

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
  const { startLoading, stopLoading } = useLoading();

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

  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    const loadProfile = async () => {
      startLoading();
      try {
        const { data } = await fetchData("auth/profile", "GET");

        if (data) {
          setUser(data);
          const { data: rolesData } = await fetchRoles("roles", "GET");
          setRoles(rolesData ?? []);
        } else {
          navigate("/login");
        }
      } catch {
        // no-op
      } finally {
        setInitializing(false);
        stopLoading();
      }
    };

    loadProfile();
  }, [fetchData, fetchRoles, navigate, startLoading, stopLoading]);

  const login = useCallback(
    async (email: string, password: string) => {
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
    },
    [fetchData, fetchRoles, navigate]
  );

  const logout = useCallback(async () => {
    await fetchData("auth/logout", "DELETE");
    setUser(null);
    setRoles([]);
    navigate("/login");
  }, [fetchData, navigate]);

  const value = useMemo(
    () => ({ user, roles, permissions, initializing, login, logout, setUser }),
    [user, roles, permissions, initializing, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
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
