import fs from 'fs';
import path from 'path';
import { isPostgresConnected, query, DB_FALLBACK_DIR } from '../db/index.js';

const PROFILES_FILE = path.join(DB_FALLBACK_DIR, 'voice_profiles.json');

function loadFallbackProfiles() {
  if (fs.existsSync(PROFILES_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveFallbackProfiles(obj) {
  try {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.warn('[VoiceProfileRepo] Could not save voice profiles fallback:', e.message);
  }
}

export const voiceProfileRepository = {
  toSafeProfile(p) {
    if (!p) return { status: 'unregistered', sampleCount: 0 };
    return {
      userId: p.userId || p.user_id,
      userName: p.userName || p.profile_name || 'Enrolled Speaker',
      status: p.status || 'active',
      sampleCount: p.sampleCount || p.sample_count || 3,
      sampleRate: p.sampleRate || p.sample_rate || '48000Hz',
      diarizationRole: 'Host / Team Lead (User)',
      similarityThreshold: 0.75,
      createdAt: p.createdAt || p.created_at,
      updatedAt: p.updatedAt || p.updated_at
      // Note: raw enrolledEmbedding is STRIPPED for API security!
    };
  },

  async findByUserId(userId) {
    if (isPostgresConnected()) {
      const res = await query('SELECT * FROM voice_profiles WHERE user_id = $1 LIMIT 1', [userId]);
      return res.rows[0] ? this.toSafeProfile(res.rows[0]) : null;
    }
    const profiles = loadFallbackProfiles();
    return profiles[userId] ? this.toSafeProfile(profiles[userId]) : null;
  },

  async getInternalEmbedding(userId) {
    // Used strictly internally by speakerEmbeddingService, never exposed to routes
    if (isPostgresConnected()) {
      const res = await query(
        `SELECT e.embedding_vector FROM voice_embeddings e
         JOIN voice_profiles p ON e.voice_profile_id = p.id
         WHERE p.user_id = $1 LIMIT 1`,
        [userId]
      );
      if (res.rows[0]?.embedding_vector) {
        return typeof res.rows[0].embedding_vector === 'string'
          ? JSON.parse(res.rows[0].embedding_vector)
          : res.rows[0].embedding_vector;
      }
    }
    const profiles = loadFallbackProfiles();
    return profiles[userId]?.enrolledEmbedding || null;
  },

  async upsert(userId, { userName = 'User', sampleCount = 3, sampleRate = '48000Hz', embedding = null }) {
    const now = new Date().toISOString();
    const profileId = `vp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const defaultVec = embedding || [0.34, 0.81, -0.22, 0.65, 0.49, -0.18, 0.77, 0.52, 0.12, -0.45, 0.61, 0.38, -0.09, 0.29, 0.55, -0.31];

    if (isPostgresConnected()) {
      await query(
        `INSERT INTO voice_profiles (id, user_id, profile_name, status, sample_count, sample_rate, created_at, updated_at)
         VALUES ($1, $2, $3, 'active', $4, $5, $6, $6)
         ON CONFLICT (user_id) DO UPDATE SET 
           profile_name = EXCLUDED.profile_name,
           sample_count = EXCLUDED.sample_count,
           sample_rate = EXCLUDED.sample_rate,
           updated_at = EXCLUDED.updated_at`,
        [profileId, userId, userName, sampleCount, sampleRate, now]
      );

      // Store embedding in secured embeddings table
      await query('DELETE FROM voice_embeddings WHERE voice_profile_id IN (SELECT id FROM voice_profiles WHERE user_id = $1)', [userId]);
      await query(
        `INSERT INTO voice_embeddings (id, voice_profile_id, sample_type, embedding_vector, created_at)
         VALUES ($1, $2, 'composite_calibration', $3, $4)`,
        [`ve_${Date.now()}`, profileId, JSON.stringify(defaultVec), now]
      );

      return this.findByUserId(userId);
    }

    const profiles = loadFallbackProfiles();
    profiles[userId] = {
      id: profileId,
      userId,
      userName,
      status: 'active',
      sampleCount,
      sampleRate,
      enrolledEmbedding: defaultVec,
      createdAt: profiles[userId]?.createdAt || now,
      updatedAt: now
    };
    saveFallbackProfiles(profiles);
    return this.toSafeProfile(profiles[userId]);
  },

  async delete(userId) {
    if (isPostgresConnected()) {
      await query('DELETE FROM voice_profiles WHERE user_id = $1', [userId]);
      return true;
    }
    const profiles = loadFallbackProfiles();
    delete profiles[userId];
    saveFallbackProfiles(profiles);
    return true;
  }
};

export default voiceProfileRepository;
