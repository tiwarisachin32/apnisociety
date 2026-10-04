import React, { createContext, useContext, useEffect, useState } from 'react';
import { PermissionType } from '../constants/app';
import {
  authenticateUser,
  clearSession,
  getSavedSession,
  MOCK_USERS,
} from '../services/mockAuth';
import { AuthState, LoginCredentials, User } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginAsDemoUser: (userOrId: string | User) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: PermissionType) => boolean;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Restore saved session on mount
  useEffect(() => {
    try {
      const saved = getSavedSession();
      if (saved) {
        setState({
          user: saved,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return;
      }
    } catch {
      // Fallback
    }
    setState((prev) => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }));
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authenticateUser(credentials);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Login failed. Please verify credentials.',
      }));
      throw err;
    }
  };

  const loginAsDemoUser = async (userOrId: string | User): Promise<void> => {
    // Restrict persona switching for non-owner users
    if (state.user && !state.user.isAppOwner) {
      const err = 'Persona switching is restricted. Only the App Owner can switch personas.';
      setState((prev) => ({ ...prev, isLoading: false, error: err }));
      throw new Error(err);
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const targetUser =
        typeof userOrId === 'string'
          ? MOCK_USERS.find((u) => u.id === userOrId) || MOCK_USERS[0]
          : userOrId;

      await new Promise((res) => setTimeout(res, 250)); // smooth visual transition

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('apnisociety_user_session', JSON.stringify(targetUser));
        } catch {
          // Ignore
        }
      }

      setState({
        user: targetUser,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Failed to switch persona.',
      }));
    }
  };

  const logout = () => {
    clearSession();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const hasPermission = (permission: PermissionType): boolean => {
    if (!state.user) return false;
    return state.user.permissions.includes(permission);
  };

  const refreshSession = () => {
    try {
      const saved = getSavedSession();
      if (saved) {
        setState((prev) => ({
          ...prev,
          user: saved,
        }));
      }
    } catch {
      // Ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginAsDemoUser,
        logout,
        hasPermission,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
