import { useAuth } from '../context/AuthContext';
import { PermissionType } from '../constants/permissions';

/**
 * Custom hook for evaluating user permissions throughout the application.
 */
export function usePermissions() {
  const { user, hasPermission } = useAuth();

  const can = (permission: PermissionType): boolean => {
    return hasPermission(permission);
  };

  const cannot = (permission: PermissionType): boolean => {
    return !hasPermission(permission);
  };

  const canAny = (permissions: PermissionType[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  const canAll = (permissions: PermissionType[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  };

  return {
    user,
    can,
    cannot,
    canAny,
    canAll,
    hasPermission,
  };
}

export default usePermissions;
