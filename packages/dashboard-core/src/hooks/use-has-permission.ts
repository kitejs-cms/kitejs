import { useCallback } from "react";
import { useAuthContext } from "../context/auth-context";

/**
 * Returns a function to verify if the current user has the specified permissions.
 *
 * @returns A function that accepts a permission or array of permissions and
 * returns true if the user has them. By default all provided permissions must
 * be present. Pass { every: false } to check if at least one permission is present.
 */
export function useHasPermission() {
  const { permissions } = useAuthContext();

  return useCallback(
    (
      target?: string | string[],
      options: { every?: boolean } = {},
    ): boolean => {
      if (!target || (Array.isArray(target) && target.length === 0)) {
        return true;
      }

      if (target === "*") {
        return permissions.size > 0;
      }

      const required = Array.isArray(target) ? target : [target];
      const method = options.every === false ? "some" : "every";

      return required[method]((perm) => permissions.has(perm));
    },
    [permissions],
  );
}
