import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { isPostgresConnected, query, DB_FALLBACK_DIR } from '../db/index.js';

const USERS_FILE = path.join(DB_FALLBACK_DIR, 'users.json');

function loadFallbackUsers() {
  if (fs.existsSync(USERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveFallbackUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.warn('[UserRepo] Could not save users fallback:', e.message);
  }
}

export const userRepository = {
  toSafeUser(user) {
    if (!user) return null;
    const { password_hash, ...safe } = user;
    return {
      id: safe.id,
      name: safe.name,
      email: safe.email,
      role: safe.role || 'user',
      organization: safe.organization || 'FinEdge Platform',
      avatar: safe.avatar || safe.name?.substring(0, 2).toUpperCase() || 'AR',
      hasVoiceProfile: !!safe.has_voice_profile,
      is_active: safe.is_active !== false,
      createdAt: safe.created_at || safe.createdAt || new Date().toISOString(),
      lastLoginAt: safe.last_login_at || safe.lastLoginAt || null
    };
  },

  async findByEmail(email) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (isPostgresConnected()) {
      const res = await query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
      return res.rows[0] || null;
    }

    const list = loadFallbackUsers();
    return list.find(u => u.email.toLowerCase() === cleanEmail) || null;
  },

  async findById(id) {
    if (isPostgresConnected()) {
      const res = await query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    }

    const list = loadFallbackUsers();
    return list.find(u => u.id === id) || null;
  },

  async create({ name, email, password, role = 'user', organization = 'General' }) {
    const cleanEmail = email.toLowerCase().trim();
    const existing = await this.findByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();
    const avatar = (name || 'User').substring(0, 2).toUpperCase();

    const userObj = {
      id,
      name,
      email: cleanEmail,
      password_hash,
      role,
      organization,
      avatar,
      is_active: true,
      has_voice_profile: false,
      created_at: now,
      updated_at: now,
      last_login_at: null
    };

    if (isPostgresConnected()) {
      await query(
        `INSERT INTO users (id, name, email, password_hash, role, organization, avatar, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, name, cleanEmail, password_hash, role, organization, avatar, true, now, now]
      );
      return userObj;
    }

    const list = loadFallbackUsers();
    list.push(userObj);
    saveFallbackUsers(list);
    return userObj;
  },

  async comparePassword(candidatePassword, passwordHash) {
    return await bcrypt.compare(candidatePassword, passwordHash);
  },

  async updateLastLogin(id) {
    const now = new Date().toISOString();
    if (isPostgresConnected()) {
      await query('UPDATE users SET last_login_at = $1, updated_at = $1 WHERE id = $2', [now, id]);
      return;
    }

    const list = loadFallbackUsers();
    const idx = list.findIndex(u => u.id === id);
    if (idx !== -1) {
      list[idx].last_login_at = now;
      list[idx].updated_at = now;
      saveFallbackUsers(list);
    }
  },

  async seedDemoUserIfNeeded() {
    const demoEmail = 'alex.rivera@finedge.io';
    const existing = await this.findByEmail(demoEmail);
    if (!existing) {
      console.log('[UserRepo] Seeding standard demo user account (Alex Rivera)...');
      await this.create({
        name: 'Alex Rivera',
        email: demoEmail,
        password: 'DemoPass123!',
        role: 'user',
        organization: 'FinEdge Technologies'
      });
    }

    const adminEmail = 'admin@finedge.io';
    const existingAdmin = await this.findByEmail(adminEmail);
    if (!existingAdmin) {
      console.log('[UserRepo] Seeding standard admin user account (Elena Rostova - Admin)...');
      await this.create({
        name: 'Elena Rostova (Admin)',
        email: adminEmail,
        password: 'AdminPass123!',
        role: 'admin',
        organization: 'G13 Security & Compliance Admin'
      });
    }

    // Ensure usr_anonymous exists for guest/public meeting references
    const anonId = 'usr_anonymous';
    const existingAnon = await this.findById(anonId);
    if (!existingAnon) {
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash('GuestPass123!', salt);
      const now = new Date().toISOString();
      if (isPostgresConnected()) {
        try {
          await query(
            `INSERT INTO users (id, name, email, password_hash, role, organization, avatar, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [anonId, 'Guest User', 'guest@finedge.local', password_hash, 'user', 'General', 'GU', true, now, now]
          );
        } catch (e) {
          // ignore conflict
        }
      } else {
        const list = loadFallbackUsers();
        if (!list.some(u => u.id === anonId)) {
          list.push({
            id: anonId,
            name: 'Guest User',
            email: 'guest@finedge.local',
            password_hash,
            role: 'user',
            organization: 'General',
            avatar: 'GU',
            is_active: true,
            created_at: now,
            updated_at: now
          });
          saveFallbackUsers(list);
        }
      }
    }
  }
};

export default userRepository;
