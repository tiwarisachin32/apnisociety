import React, { createContext, useContext, useEffect, useState } from 'react';
import { PermissionType } from '../constants/app';
import {
  authenticateUser,
  changeUserPassword,
  clearSession,
  getSavedSession,
  MOCK_USERS,
} from '../services/mockAuth';
import { apiClient } from '../services/apiClient';
import { AuthState, LoginCredentials, User } from '../types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginAsDemoUser: (userOrId: string | User) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: PermissionType) => boolean;
  refreshSession: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const saved = getSavedSession();
      if (saved) {
        return {
          user: saved,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        };
      }
    } catch {
      // Fallback
    }
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
  });

  // Keep saved session in sync
  useEffect(() => {
    try {
      const saved = getSavedSession();
      if (saved && !state.user) {
        setState({
          user: saved,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      }
    } catch {
      // Fallback
    }
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
          if (targetUser.societyId) {
            localStorage.setItem('apnisociety_active_society_id', targetUser.societyId);
          }
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

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!state.user?.id) {
      throw new Error('You must be signed in to change your password.');
    }
    try {
      const res = await apiClient.changePassword(state.user.id, currentPassword, newPassword);
      return res;
    } catch {
      const fallback = changeUserPassword(state.user.id, currentPassword, newPassword);
      return fallback;
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
        changePassword,
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
