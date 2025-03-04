import { useState, useCallback } from "react";
import {
  type ApiResponse,
  MetaModel,
} from "@kitejs/core/common/models/api-response.model";

// eslint-disable-next-line turbo/no-undeclared-env-vars
const baseUrl = import.meta.env.VITE_API_URL;

type UseApiResult<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  meta: MetaModel | null;
  fetchData: (
    url: string,
    method?: "GET" | "POST" | "PUT" | "DELETE",
    body?: Record<string, unknown>,
    options?: RequestInit
  ) => Promise<{
    data: T | null;
    meta: MetaModel | null;
    error: string | null;
  }>;
};

export function useApi<T>(): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<MetaModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (
      url: string,
      method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
      body?: Record<string, unknown>,
      options?: RequestInit
    ): Promise<{
      data: T | null;
      meta: MetaModel | null;
      error: string | null;
    }> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${baseUrl}/${url}`, {
          method,
          body: body ? JSON.stringify(body) : undefined,
          headers: {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
          },
          ...options,
        });

        const result: ApiResponse<T> = await response.json();

        if (!response.ok || result.status !== "success") {
          throw new Error(result.message || "An error occurred");
        }

        setData(result.data ?? null);
        setMeta(result.meta ?? null);

        return {
          data: result.data ?? null,
          meta: result.meta ?? null,
          error: null,
        };
      } catch (err) {
        const errorMessage = (err as Error).message;
        setError(errorMessage);
        setData(null);
        setMeta(null);

        return { data: null, meta: null, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, meta, fetchData };
}
