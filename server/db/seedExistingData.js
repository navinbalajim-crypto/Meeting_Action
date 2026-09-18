import fs from 'fs';
import path from 'path';
import { isPostgresConnected, query } from './index.js';
import { userRepository } from '../repositories/userRepository.js';
import { meetingRepository } from '../repositories/meetingRepository.js';

const MEETINGS_FILE = path.resolve('uploads', 'meetings.json');

export async function migrateHistoricalData() {
  // Ensure default demo account exists
  await userRepository.seedDemoUserIfNeeded();
  const demoUser = await userRepository.findByEmail('alex.rivera@finedge.io');
  const fallbackOwnerId = demoUser ? demoUser.id : 'usr_alex_rivera';

  if (!fs.existsSync(MEETINGS_FILE)) {
    return;
  }

  try {
    const raw = fs.readFileSync(MEETINGS_FILE, 'utf8');
    const existingMeetings = JSON.parse(raw);

    if (!Array.isArray(existingMeetings) || existingMeetings.length === 0) {
      return;
    }

    console.log(`[Migration] Discovered ${existingMeetings.length} historical meetings in uploads/meetings.json`);

    let migratedCount = 0;
    for (const m of existingMeetings) {
      try {
        // Ensure owner_id points to an existing user
        if (m.owner_id) {
          const ownerExists = await userRepository.findById(m.owner_id);
          if (!ownerExists) {
            m.owner_id = fallbackOwnerId;
          }
        } else {
          m.owner_id = fallbackOwnerId;
        }

        if (isPostgresConnected()) {
          const existing = await meetingRepository.findById(m.id);
          if (!existing) {
            await meetingRepository.create(m);
            migratedCount++;
          }

          if (m.audioUrl) {
            const audioExists = await query('SELECT id FROM audio_files WHERE meeting_id = $1 LIMIT 1', [m.id]);
            if (audioExists.rows.length === 0) {
              const fileName = path.basename(m.audioUrl);
              await query(
                `INSERT INTO audio_files (id, meeting_id, uploaded_by, original_filename, storage_path, mime_type, file_size, duration_sec, audio_metrics, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (id) DO NOTHING`,
                [
                  `aud_${m.id}`,
                  m.id,
                  m.owner_id || fallbackOwnerId,
                  fileName,
                  path.resolve('uploads', 'audio', fileName),
                  fileName.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
                  0,
                  m.rawDurationSec || 0,
                  m.audioMetrics ? JSON.stringify(m.audioMetrics) : null,
                  new Date().toISOString()
                ]
              );
            }
          }
        } else {
          migratedCount++;
        }
      } catch (itemErr) {
        console.warn(`[Migration Warning] Could not migrate meeting ${m.id || 'unknown'}:`, itemErr.message);
      }
    }

    // If in fallback mode, save back updated meetings with owner_id assigned
    if (!isPostgresConnected()) {
      fs.writeFileSync(MEETINGS_FILE, JSON.stringify(existingMeetings, null, 2));
    }

    console.log(`✅ [Migration] Successfully secured and mapped ${migratedCount} historical meetings.`);
  } catch (err) {
    console.warn('[Migration Warning] Error during historical data migration:', err.message);
  }
}

export default migrateHistoricalData;
