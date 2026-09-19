import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { userRepository } from '../repositories/userRepository.js';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'g13_super_secret_jwt_access_key_2026_x9k2p';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'g13_super_secret_jwt_refresh_key_2026_q8m4z';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

export const authController = {
  async register(req, res) {
    try {
      const { name, email, password, organization } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Name is required.' } });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Valid email address is required.' } });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Password must be at least 6 characters long.' } });
      }

      const cleanEmail = (email || '').toLowerCase().trim();
      const existing = await userRepository.findByEmail(cleanEmail);
      if (existing) {
        return res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' } });
      }

      const user = await userRepository.create({
        name: name.trim(),
        email: cleanEmail,
        password,
        organization: organization || 'General'
      });

      const safeUser = userRepository.toSafeUser(user);
      const token = generateAccessToken(safeUser);
      const rawRefreshToken = generateRefreshToken();

      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);
      await refreshTokenRepository.create(safeUser.id, rawRefreshToken, refreshExpiresAt);

      // Matches frontend contract { token, user }
      res.status(201).json({
        success: true,
        token,
        refreshToken: rawRefreshToken,
        user: safeUser
      });
    } catch (err) {
      console.error('[Auth Register Error]', err);
      res.status(500).json({ success: false, error: { code: 'REGISTER_FAILED', message: err.message } });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
        });
      }

      const cleanEmail = (email || '').toLowerCase().trim();
      const user = await userRepository.findByEmail(cleanEmail);
      if (!user) {
        return res.status(404).json({
          success: false,
          notRegistered: true,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No account found with this email ID. Please create an account to generate your User ID and password.'
          }
        });
      }

      const isMatch = await userRepository.comparePassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'WRONG_PASSWORD',
            message: 'Wrong User ID or Password. Please check your credentials and try again.'
          }
        });
      }

      await userRepository.updateLastLogin(user.id);

      const safeUser = userRepository.toSafeUser(user);
      const token = generateAccessToken(safeUser);
      const rawRefreshToken = generateRefreshToken();

      const refreshExpiresAt = new Date();
      refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);
      await refreshTokenRepository.create(safeUser.id, rawRefreshToken, refreshExpiresAt);

      // Returns format expected by frontend authService
      res.json({
        success: true,
        token,
        refreshToken: rawRefreshToken,
        user: safeUser
      });
    } catch (err) {
      console.error('[Auth Login Error]', err);
      res.status(500).json({ success: false, error: { code: 'LOGIN_FAILED', message: 'Authentication error occurred.' } });
    }
  },

  async refresh(req, res) {
    try {
      const rawToken = req.body.refreshToken || req.headers['x-refresh-token'];
      if (!rawToken) {
        return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Refresh token required.' } });
      }

      const validSession = await refreshTokenRepository.findValid(rawToken);
      if (!validSession) {
        return res.status(401).json({ success: false, error: { code: 'INVALID_REFRESH_TOKEN', message: 'Session expired or token revoked.' } });
      }

      const user = await userRepository.findById(validSession.user_id || validSession.userId);
      if (!user) {
        return res.status(401).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User account not found.' } });
      }

      // Rotate refresh token for security
      await refreshTokenRepository.revoke(rawToken);
      const newRefreshToken = generateRefreshToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await refreshTokenRepository.create(user.id, newRefreshToken, expiresAt);

      const safeUser = userRepository.toSafeUser(user);
      const newToken = generateAccessToken(safeUser);

      res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        user: safeUser
      });
    } catch (err) {
      console.error('[Auth Refresh Error]', err);
      res.status(500).json({ success: false, error: { code: 'REFRESH_FAILED', message: err.message } });
    }
  },

  async logout(req, res) {
    try {
      const rawToken = req.body.refreshToken || req.headers['x-refresh-token'];
      if (rawToken) {
        await refreshTokenRepository.revoke(rawToken);
      }
      if (req.user) {
        await refreshTokenRepository.revokeAllForUser(req.user.id);
      }
      res.json({ success: true, message: 'Successfully logged out and session revoked.' });
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'LOGOUT_FAILED', message: err.message } });
    }
  },

  async me(req, res) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
    const user = await userRepository.findById(req.user.id);
    res.json({
      success: true,
      user: userRepository.toSafeUser(user)
    });
  }
};

export default authController;
