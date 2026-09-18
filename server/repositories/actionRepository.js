import fs from 'fs';
import path from 'path';
import { isPostgresConnected, query, DB_FALLBACK_DIR } from '../db/index.js';
import { meetingRepository } from './meetingRepository.js';

const ACTIONS_FILE = path.join(DB_FALLBACK_DIR, 'actions.json');

function loadFallbackActions() {
  if (fs.existsSync(ACTIONS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ACTIONS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveFallbackActions(list) {
  try {
    fs.writeFileSync(ACTIONS_FILE, JSON.stringify(list, null, 2));
  } catch (e) {
    console.warn('[ActionRepo] Could not save actions fallback:', e.message);
  }
}

export const actionRepository = {
  async findById(id) {
    if (isPostgresConnected()) {
      const res = await query('SELECT * FROM action_items WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] ? this._mapPgRowToAction(res.rows[0]) : null;
    }
    const list = loadFallbackActions();
    return list.find(a => a.id === id) || null;
  },

  async findForMeeting(meetingId) {
    if (isPostgresConnected()) {
      const res = await query('SELECT * FROM action_items WHERE meeting_id = $1 ORDER BY created_at DESC', [meetingId]);
      return res.rows.map(r => this._mapPgRowToAction(r));
    }
    const list = loadFallbackActions();
    return list.filter(a => a.meetingId === meetingId || a.meeting_id === meetingId);
  },

  async findForUser(userId, role = 'user') {
    if (isPostgresConnected()) {
      if (role === 'admin') {
        const res = await query('SELECT * FROM action_items ORDER BY created_at DESC');
        return res.rows.map(r => this._mapPgRowToAction(r));
      }
      const res = await query(
        `SELECT a.* FROM action_items a
         JOIN meetings m ON a.meeting_id = m.id
         WHERE m.owner_id = $1 OR m.is_demo = TRUE
         ORDER BY a.created_at DESC`,
        [userId]
      );
      return res.rows.map(r => this._mapPgRowToAction(r));
    }

    // Fallback: extract actions from user's meetings and fallback file
    const userMeetings = await meetingRepository.findForUser(userId, role);
    const meetingIds = new Set(userMeetings.map(m => m.id));

    // Also pull actions directly from meeting report actionItems if not in standalone store
    const standalone = loadFallbackActions().filter(a => meetingIds.has(a.meetingId) || meetingIds.has(a.meeting_id));
    
    // Aggregate extracted report actions
    const aggregated = [...standalone];
    const existingIds = new Set(standalone.map(a => a.id));

    for (const m of userMeetings) {
      if (m.report?.actionItems && Array.isArray(m.report.actionItems)) {
        for (const act of m.report.actionItems) {
          if (!existingIds.has(act.id)) {
            aggregated.push({
              id: act.id,
              meetingId: m.id,
              task: act.task,
              owner: act.owner,
              deadline: act.deadline,
              status: act.status || 'Committed',
              confidence: act.confidence || 'High',
              speaker: act.speaker || 'Identified Speaker',
              timestamp: act.timestamp || '00:00',
              evidence: act.evidence,
              meetingTitle: m.title,
              meetingDate: m.date
            });
            existingIds.add(act.id);
          }
        }
      }
    }

    return aggregated;
  },

  async create(data) {
    const id = data.id || `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const action = {
      id,
      meetingId: data.meetingId || data.meeting_id,
      task: data.task,
      owner: data.owner || 'Needs Clarification',
      deadline: data.deadline || 'Not specified',
      status: data.status || 'Committed',
      confidence: data.confidence || 'High',
      speaker: data.speaker || '',
      timestamp: data.timestamp || '',
      evidence: data.evidence || null,
      createdAt: now,
      updatedAt: now
    };

    if (isPostgresConnected()) {
      await query(
        `INSERT INTO action_items (id, meeting_id, task, owner, deadline, status, confidence, speaker, timestamp_label, evidence_quote, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           task = EXCLUDED.task,
           owner = EXCLUDED.owner,
           deadline = EXCLUDED.deadline,
           status = EXCLUDED.status,
           confidence = EXCLUDED.confidence,
           speaker = EXCLUDED.speaker,
           timestamp_label = EXCLUDED.timestamp_label,
           evidence_quote = EXCLUDED.evidence_quote,
           updated_at = EXCLUDED.updated_at`,
        [action.id, action.meetingId, action.task, action.owner, action.deadline, action.status, action.confidence, action.speaker, action.timestamp, typeof action.evidence === 'string' ? action.evidence : action.evidence?.quote || '', now, now]
      );
      return action;
    }

    const list = loadFallbackActions();
    list.unshift(action);
    saveFallbackActions(list);
    return action;
  },

  async update(id, fields) {
    const now = new Date().toISOString();
    const validStatuses = ['Committed', 'In Progress', 'Completed', 'Needs Clarification', 'Cancelled'];

    if (fields.status && !validStatuses.includes(fields.status)) {
      throw new Error(`Invalid action status. Allowed: ${validStatuses.join(', ')}`);
    }

    if (isPostgresConnected()) {
      const updates = [];
      const values = [];
      let idx = 1;

      if (fields.task) { updates.push(`task = $${idx++}`); values.push(fields.task); }
      if (fields.owner) { updates.push(`owner = $${idx++}`); values.push(fields.owner); }
      if (fields.deadline) { updates.push(`deadline = $${idx++}`); values.push(fields.deadline); }
      if (fields.status) { updates.push(`status = $${idx++}`); values.push(fields.status); }

      updates.push(`updated_at = $${idx++}`);
      values.push(now);
      values.push(id);

      await query(`UPDATE action_items SET ${updates.join(', ')} WHERE id = $${idx}`, values);
      return this.findById(id);
    }

    const list = loadFallbackActions();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...fields, updatedAt: now };
      saveFallbackActions(list);
      return list[idx];
    }
    return null;
  },

  _mapPgRowToAction(r) {
    return {
      id: r.id,
      meetingId: r.meeting_id,
      task: r.task,
      owner: r.owner,
      deadline: r.deadline,
      status: r.status,
      confidence: r.confidence,
      speaker: r.speaker,
      timestamp: r.timestamp_label,
      evidence: {
        quote: r.evidence_quote,
        speaker: r.speaker,
        timestamp: r.timestamp_label
      },
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
};

export default actionRepository;
