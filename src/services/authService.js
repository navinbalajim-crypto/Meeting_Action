import { api } from './api';

const USER_STORAGE_KEY = 'g13_current_user';

export const authService = {
  getCurrentUser() {
    const userJson = localStorage.getItem(USER_STORAGE_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  async login(email, password, portal = null) {
    const cleanEmail = (email || '').trim();
    if (!cleanEmail || !password) {
      throw new Error('Please enter both your email address and password.');
    }

    try {
      const response = await api.post('/auth/login', { email: cleanEmail, password, portal });
      if (response && response.token) {
        api.setToken(response.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        return response.user;
      }
      throw new Error('Authentication failed: No token received.');
    } catch (err) {
      // Re-throw server errors (wrong password, user not found, 400, 401, 403 role mismatch, 404)
      const isNetworkOffline = err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'));
      if (!isNetworkOffline) {
        throw err;
      }

      console.log('[Auth] Network unreachable - local demo fallback used.');
      const name = cleanEmail.split('@')[0].replace('.', ' ');
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const isExpectedAdmin = portal === 'admin';
      const mockUser = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        name: formattedName || (isExpectedAdmin ? 'Admin Lead' : 'Alex Rivera'),
        email: cleanEmail,
        role: isExpectedAdmin ? 'admin' : 'user',
        organization: isExpectedAdmin ? 'G13 Security Admin' : 'FinEdge Platform',
        avatar: (formattedName || (isExpectedAdmin ? 'AD' : 'AR')).substring(0, 2).toUpperCase(),
        hasVoiceProfile: false,
        createdAt: new Date().toISOString()
      };
      api.setToken('mock_jwt_token_' + Date.now());
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      return mockUser;
    }
  },

  async signup(name, email, password, organization = 'General', role = 'user') {
    const cleanEmail = (email || '').trim();
    const cleanName = (name || '').trim();

    if (!cleanName || !cleanEmail || !password) {
      throw new Error('Please enter your full name, work email address, and password.');
    }

    try {
      const response = await api.post('/auth/signup', { 
        name: cleanName, 
        email: cleanEmail, 
        password,
        organization,
        role: role || 'user'
      });
      if (response && response.token) {
        api.setToken(response.token);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        return response.user;
      }
      throw new Error('Registration failed: No token received.');
    } catch (err) {
      const isNetworkOffline = err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'));
      if (!isNetworkOffline) {
        throw err;
      }

      console.log('[Auth] Network unreachable - local demo fallback used.');
      const mockUser = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        name: cleanName,
        email: cleanEmail,
        role: role || 'user',
        organization: organization || 'FinEdge Platform',
        avatar: cleanName.substring(0, 2).toUpperCase(),
        hasVoiceProfile: false,
        createdAt: new Date().toISOString()
      };
      api.setToken('mock_jwt_token_' + Date.now());
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
      return mockUser;
    }
  },

  async loginDemoUser(portal = 'user') {
    if (portal === 'admin') {
      return this.login('admin@finedge.io', 'AdminPass123!', 'admin');
    }
    return this.login('alex.rivera@finedge.io', 'DemoPass123!', 'user');
  },

  logout() {
    api.setToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  },

  updateUserVoiceProfileStatus(hasProfile) {
    const user = this.getCurrentUser();
    if (user) {
      user.hasVoiceProfile = hasProfile;
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(`g13_voice_profile_${user.email}`, 'active');
    }
    return user;
  }
};

export default authService;
