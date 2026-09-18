import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { isPostgresConnected, query, DB_FALLBACK_DIR } from '../db/index.js';

const TOKENS_FILE = path.join(DB_FALLBACK_DIR, 'refresh_tokens.json');

function loadFallbackTokens() {
  if (fs.existsSync(TOKENS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveFallbackTokens(tokens) {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
  } catch (e) {
    console.warn('[RefreshTokenRepo] Could not save tokens fallback:', e.message);
  }
}

export const refreshTokenRepository = {
  hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  },

  async create(userId, rawToken, expiresAt) {
    const id = `rtk_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const tokenHash = this.hashToken(rawToken);
    const now = new Date().toISOString();

    if (isPostgresConnected()) {
      await query(
        `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, userId, tokenHash, expiresAt.toISOString(), now]
      );
      return { id, userId, tokenHash, expiresAt };
    }

    const list = loadFallbackTokens();
    const tokenObj = { id, userId, tokenHash, expiresAt: expiresAt.toISOString(), revokedAt: null, createdAt: now };
    list.push(tokenObj);
    saveFallbackTokens(list);
    return tokenObj;
  },

  async findValid(rawToken) {
    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    if (isPostgresConnected()) {
      const res = await query(
        `SELECT * FROM refresh_tokens 
         WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW() 
         LIMIT 1`,
        [tokenHash]
      );
      return res.rows[0] || null;
    }

    const list = loadFallbackTokens();
    return list.find(t => t.tokenHash === tokenHash && !t.revokedAt && new Date(t.expiresAt) > now) || null;
  },

  async revoke(rawToken) {
    const tokenHash = this.hashToken(rawToken);
    const now = new Date().toISOString();

    if (isPostgresConnected()) {
      await query('UPDATE refresh_tokens SET revoked_at = $1 WHERE token_hash = $2', [now, tokenHash]);
      return;
    }

    const list = loadFallbackTokens();
    const token = list.find(t => t.tokenHash === tokenHash);
    if (token) {
      token.revokedAt = now;
      saveFallbackTokens(list);
    }
  },

  async revokeAllForUser(userId) {
    const now = new Date().toISOString();
    if (isPostgresConnected()) {
      await query('UPDATE refresh_tokens SET revoked_at = $1 WHERE user_id = $2', [now, userId]);
      return;
    }

    const list = loadFallbackTokens();
    list.forEach(t => {
      if (t.userId === userId) t.revokedAt = now;
    });
    saveFallbackTokens(list);
  }
};

export default refreshTokenRepository;
