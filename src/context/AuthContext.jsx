import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { voiceProfileService } from '../services/voiceProfileService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, onNavigate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial user session
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // Check if voice profile is active
      const voiceData = voiceProfileService.getProfileStatus(currentUser.id);
      currentUser.hasVoiceProfile = voiceData.status === 'active';
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const loggedUser = await authService.login(email, password);
      setUser(loggedUser);
      setLoading(false);
      window.location.hash = 'dashboard';
      if (onNavigate) {
        onNavigate('dashboard');
      }
      return loggedUser;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signup = async (name, email, password, organization = 'General') => {
    setLoading(true);
    try {
      const newUser = await authService.signup(name, email, password, organization);
      setUser(newUser);
      setLoading(false);
      window.location.hash = 'dashboard';
      if (onNavigate) {
        onNavigate('dashboard');
      }
      return newUser;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginDemo = async () => {
    setLoading(true);
    const demoUser = await authService.loginDemoUser();
    setUser(demoUser);
    setLoading(false);
    if (onNavigate) {
      onNavigate('dashboard');
    }
    return demoUser;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    if (onNavigate) {
      onNavigate('auth');
    }
  };

  const markVoiceProfileActive = () => {
    if (user) {
      const updated = authService.updateUserVoiceProfileStatus(true);
      setUser({ ...user, hasVoiceProfile: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        hasVoiceProfile: !!user?.hasVoiceProfile,
        login,
        signup,
        loginDemo,
        logout,
        markVoiceProfileActive
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
