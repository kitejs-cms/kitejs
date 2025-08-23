import { useEffect, useState } from "react";

export function useMinWidth(px: number) {
  const getMatch = () =>
    typeof window !== "undefined"
      ? window.matchMedia(`(min-width: ${px}px)`).matches
      : false;

  const [matches, setMatches] = useState<boolean>(getMatch);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(min-width: ${px}px)`);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    // sync iniziale (utile se l'istanza è cambiata)
    setMatches(mql.matches);
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, [px]);

  return matches;
}
