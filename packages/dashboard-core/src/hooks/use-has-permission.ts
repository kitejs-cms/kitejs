import { useAuthContext } from "../context/auth-context";

/**
 * Returns a function to verify if the current user has the specified permissions.
 *
 * @returns A function that accepts a permission or array of permissions and
 * returns true if the user has them. By default all provided permissions must
 * be present. Pass { every: false } to check if at least one permission is present.
 */
export function useHasPermission() {
  const { user } = useAuthContext();

  return (
    permissions?: string | string[],
    options: { every?: boolean } = {}
  ): boolean => {
    if (!permissions || (Array.isArray(permissions) && permissions.length === 0)) {
      return true;
    }

    const required = Array.isArray(permissions) ? permissions : [permissions];
    const userPermissions = user?.permissions ?? [];
    const method = options.every === false ? "some" : "every";

    return required[method]((perm) => userPermissions.includes(perm));
  };
}
