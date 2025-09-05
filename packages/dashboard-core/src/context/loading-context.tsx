import { createContext, useContext, useState, ReactNode } from "react";

interface LoadingContextValue {
  loading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const startLoading = () => setCount((c) => c + 1);
  const stopLoading = () => setCount((c) => Math.max(c - 1, 0));

  return (
    <LoadingContext.Provider value={{ loading: count > 0, startLoading, stopLoading }}>
      {children}
      {count > 0 && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    return {
      loading: false,
      startLoading: () => {},
      stopLoading: () => {},
    };
  }
  return context;
}

