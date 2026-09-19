import fs from 'fs';
import path from 'path';
import { isPostgresConnected, query } from '../db/index.js';

const MEETINGS_FILE = path.resolve('uploads', 'meetings.json');

function loadFallbackMeetings() {
  if (fs.existsSync(MEETINGS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(MEETINGS_FILE, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

function saveFallbackMeetings(list) {
  try {
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(list, null, 2));
  } catch (e) {
    console.warn('[MeetingRepo] Could not save meetings fallback:', e.message);
  }
}

export const meetingRepository = {
  async findById(id) {
    if (!id) return null;
    if (isPostgresConnected()) {
      const res = await query('SELECT * FROM meetings WHERE id = $1 LIMIT 1', [id]);
      if (!res.rows[0]) return null;
      return this._mapPgRowToMeeting(res.rows[0]);
    }
    const list = loadFallbackMeetings();
    return list.find(m => m.id === id) || null;
  },

  async findByCode(code) {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();
    if (isPostgresConnected()) {
      const res = await query('SELECT * FROM meetings WHERE UPPER(meeting_code) = $1 LIMIT 1', [cleanCode]);
      if (!res.rows[0]) return null;
      return this._mapPgRowToMeeting(res.rows[0]);
    }
    const list = loadFallbackMeetings();
    return list.find(m => m.code?.toUpperCase() === cleanCode) || null;
  },

  async findByIdOrCode(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim();
    const cleanCode = clean.toUpperCase();

    if (isPostgresConnected()) {
      const res = await query(
        'SELECT * FROM meetings WHERE id = $1 OR UPPER(meeting_code) = $2 LIMIT 1',
        [clean, cleanCode]
      );
      if (!res.rows[0]) return null;
      return this._mapPgRowToMeeting(res.rows[0]);
    }

    const list = loadFallbackMeetings();
    return list.find(m => m.id === clean || m.code?.toUpperCase() === cleanCode) || null;
  },

  async findForUser(userId, role = 'user') {
    if (isPostgresConnected()) {
      if (role === 'admin') {
        const res = await query('SELECT * FROM meetings ORDER BY created_at DESC');
        return res.rows.map(r => this._mapPgRowToMeeting(r));
      }

      const res = await query(
        `SELECT m.* FROM meetings m
         LEFT JOIN meeting_participants p ON m.id = p.meeting_id
         WHERE m.owner_id = $1 OR p.user_id = $1 OR m.is_demo = TRUE
         GROUP BY m.id
         ORDER BY m.created_at DESC`,
        [userId]
      );
      return res.rows.map(r => this._mapPgRowToMeeting(r));
    }

    const list = loadFallbackMeetings();
    if (role === 'admin') return list;

    // Filter by ownership, participation, or demo status
    return list.filter(m => 
      m.owner_id === userId ||
      m.isDemo ||
      m.is_demo ||
      (Array.isArray(m.participants) && m.participants.some(p => p.id === userId || p.user_id === userId))
    );
  },

  async create(meetingData) {
    const now = new Date().toISOString();
    const meeting = {
      id: meetingData.id || `meet-${Date.now()}`,
      code: meetingData.code || meetingData.meeting_code || `G13-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      title: meetingData.title || 'Untitled Meeting',
      owner_id: meetingData.owner_id || meetingData.ownerId || 'usr_anonymous',
      client: meetingData.client || meetingData.client_name || 'Enterprise Client',
      organization: meetingData.organization || 'Core Platform',
      date: meetingData.date || 'Today',
      duration: meetingData.duration || '0 min',
      rawDurationSec: meetingData.rawDurationSec || 0,
      status: meetingData.status || 'active',
      isDemo: !!meetingData.isDemo || !!meetingData.is_demo,
      type: meetingData.type || 'Strategy & Architecture',
      audioUrl: meetingData.audioUrl || null,
      participants: meetingData.participants || [],
      summary: meetingData.summary || '',
      report: meetingData.report || null,
      transcript: meetingData.transcript || [],
      audioMetrics: meetingData.audioMetrics || null,
      stats: meetingData.stats || { commitmentsCount: 0, decisionsCount: 0, actionsCount: 0 },
      createdAt: now,
      updatedAt: now
    };

    if (isPostgresConnected()) {
      await query(
        `INSERT INTO meetings (
          id, meeting_code, title, owner_id, client_name, organization, 
          meeting_type, status, is_demo, duration, raw_duration_sec, 
          summary, report_data, audio_metrics, audio_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          meeting.id, meeting.code, meeting.title, meeting.owner_id, meeting.client,
          meeting.organization, meeting.type, meeting.status, meeting.isDemo,
          meeting.duration, meeting.rawDurationSec, meeting.summary,
          meeting.report ? JSON.stringify(meeting.report) : null,
          meeting.audioMetrics ? JSON.stringify(meeting.audioMetrics) : null,
          meeting.audioUrl, now, now
        ]
      );

      // Insert participants
      if (Array.isArray(meeting.participants)) {
        for (const p of meeting.participants) {
          await query(
            `INSERT INTO meeting_participants (id, meeting_id, user_id, display_name, role, is_user, avatar, color, joined_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              `part_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              meeting.id,
              p.id === meeting.owner_id ? meeting.owner_id : null,
              p.name || 'Participant',
              p.role || 'Attendee',
              !!p.isUser,
              p.avatar || 'AT',
              p.color || '#5B6CFF',
              now
            ]
          );
        }
      }

      return meeting;
    }

    const list = loadFallbackMeetings();
    list.unshift(meeting);
    saveFallbackMeetings(list);
    return meeting;
  },

  async update(id, fields) {
    const now = new Date().toISOString();
    if (isPostgresConnected()) {
      const updates = [];
      const values = [];
      let idx = 1;

      if (fields.title) { updates.push(`title = $${idx++}`); values.push(fields.title); }
      if (fields.status) { updates.push(`status = $${idx++}`); values.push(fields.status); }
      if (fields.summary) { updates.push(`summary = $${idx++}`); values.push(fields.summary); }
      if (fields.report) { updates.push(`report_data = $${idx++}`); values.push(JSON.stringify(fields.report)); }
      if (fields.audioMetrics) { updates.push(`audio_metrics = $${idx++}`); values.push(JSON.stringify(fields.audioMetrics)); }

      updates.push(`updated_at = $${idx++}`);
      values.push(now);
      values.push(id);

      await query(`UPDATE meetings SET ${updates.join(', ')} WHERE id = $${idx}`, values);
      return this.findById(id);
    }

    const list = loadFallbackMeetings();
    const idx = list.findIndex(m => m.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...fields, updatedAt: now };
      saveFallbackMeetings(list);
      return list[idx];
    }
    return null;
  },

  async delete(id) {
    if (isPostgresConnected()) {
      await query('DELETE FROM meetings WHERE id = $1', [id]);
      return true;
    }
    const list = loadFallbackMeetings();
    const filtered = list.filter(m => m.id !== id);
    saveFallbackMeetings(filtered);
    return true;
  },

  async addParticipant(meetingId, participant) {
    const now = new Date().toISOString();
    const meeting = await this.findByIdOrCode(meetingId);
    if (!meeting) return null;

    const newPart = {
      id: participant.id || `p-${Date.now()}`,
      name: participant.name || 'Attendee',
      role: participant.role || 'Guest',
      isUser: !!participant.isUser,
      avatar: participant.avatar || (participant.name || 'MB').substring(0, 2).toUpperCase(),
      color: participant.color || '#10B981'
    };

    if (isPostgresConnected()) {
      await query(
        `INSERT INTO meeting_participants (id, meeting_id, user_id, display_name, role, is_user, avatar, color, joined_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [newPart.id, meeting.id, participant.userId || null, newPart.name, newPart.role, newPart.isUser, newPart.avatar, newPart.color, now]
      );
    }

    const list = loadFallbackMeetings();
    const target = list.find(m => m.id === meeting.id || m.code?.toUpperCase() === meeting.code?.toUpperCase());
    if (target) {
      if (!Array.isArray(target.participants)) target.participants = [];
      target.participants.push(newPart);
      saveFallbackMeetings(list);
    }

    return newPart;
  },

  async saveChatMessage(meetingIdentifier, msg) {
    const now = new Date().toISOString();
    let meeting = await this.findByIdOrCode(meetingIdentifier);
    if (!meeting) {
      const code = (meetingIdentifier || '').trim().toUpperCase();
      meeting = await this.create({
        code: code.startsWith('G13-') ? code : `G13-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        title: `Live Meeting (${meetingIdentifier})`,
        status: 'active'
      });
    }

    const messageId = msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const sender = msg.sender || {};
    const chatMsg = {
      id: messageId,
      meeting_id: meeting.id,
      meeting_code: meeting.code,
      sender_id: sender.id || msg.senderId || 'usr_anonymous',
      sender_name: sender.name || msg.senderName || 'Attendee',
      sender_role: sender.role || msg.senderRole || 'Participant',
      is_user: !!(sender.isUser ?? msg.isUser ?? true),
      is_bot: !!(sender.isBot ?? msg.isBot ?? false),
      text: msg.text || '',
      timestamp_label: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      commitment_details: msg.commitmentDetails || null,
      created_at: now
    };

    if (isPostgresConnected()) {
      try {
        await query(
          `INSERT INTO chat_messages (id, meeting_id, meeting_code, sender_id, sender_name, sender_role, is_user, is_bot, text, timestamp_label, commitment_details, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, commitment_details = EXCLUDED.commitment_details`,
          [
            chatMsg.id,
            chatMsg.meeting_id,
            chatMsg.meeting_code,
            chatMsg.sender_id,
            chatMsg.sender_name,
            chatMsg.sender_role,
            chatMsg.is_user,
            chatMsg.is_bot,
            chatMsg.text,
            chatMsg.timestamp_label,
            chatMsg.commitment_details ? JSON.stringify(chatMsg.commitment_details) : null,
            chatMsg.created_at
          ]
        );

        // Also mirror into transcript_segments for unified multi-mode analytics
        await query(
          `INSERT INTO transcript_segments (id, meeting_id, speaker_id, speaker_name, is_user_match, timestamp_label, text, confidence, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [
            `seg_${chatMsg.id}`,
            chatMsg.meeting_id,
            chatMsg.sender_id,
            chatMsg.sender_name,
            chatMsg.is_user,
            chatMsg.timestamp_label,
            chatMsg.text,
            1.0,
            chatMsg.created_at
          ]
        );
      } catch (err) {
        console.warn('[MeetingRepo] Error writing chat message to DB:', err.message);
      }
    }

    // Always update fallback JSON cache
    const list = loadFallbackMeetings();
    const target = list.find(m => m.id === meeting.id || m.code?.toUpperCase() === meeting.code?.toUpperCase());
    if (target) {
      if (!Array.isArray(target.chatMessages)) target.chatMessages = [];
      if (!Array.isArray(target.transcript)) target.transcript = [];

      const exists = target.chatMessages.some(m => m.id === chatMsg.id);
      if (!exists) {
        target.chatMessages.push(chatMsg);
        target.transcript.push({
          id: chatMsg.id,
          speakerId: chatMsg.sender_id,
          speakerName: chatMsg.sender_name,
          speakerRole: chatMsg.sender_role,
          isUser: chatMsg.is_user,
          isBot: chatMsg.is_bot,
          timestamp: chatMsg.timestamp_label,
          text: chatMsg.text,
          commitmentDetails: chatMsg.commitment_details
        });
        target.updatedAt = now;
        saveFallbackMeetings(list);
      }
    }

    // Return normalized format matching getChatMessages so clients receive consistent properties
    return {
      id: chatMsg.id,
      meetingId: chatMsg.meeting_id,
      meetingCode: chatMsg.meeting_code,
      sender: {
        id: chatMsg.sender_id,
        name: chatMsg.sender_name,
        role: chatMsg.sender_role,
        isUser: chatMsg.is_user,
        isBot: chatMsg.is_bot
      },
      text: chatMsg.text,
      timestamp: chatMsg.timestamp_label,
      commitmentDetails: chatMsg.commitment_details,
      createdAt: chatMsg.created_at
    };
  },

  async getChatMessages(meetingIdentifier) {
    if (!meetingIdentifier) return [];
    const cleanCode = (meetingIdentifier || '').trim().toUpperCase();
    const meeting = await this.findByIdOrCode(meetingIdentifier);
    const meetingId = meeting ? meeting.id : cleanCode;
    const targetCode = meeting ? meeting.code.toUpperCase() : cleanCode;

    if (isPostgresConnected()) {
      try {
        const res = await query(
          `SELECT * FROM chat_messages WHERE meeting_id = $1 OR UPPER(meeting_code) = $2 OR UPPER(meeting_code) = $3 ORDER BY created_at ASC`,
          [meetingId, targetCode, cleanCode]
        );
        if (res.rows && res.rows.length > 0) {
          return res.rows.map(r => ({
            id: r.id,
            meetingId: r.meeting_id,
            meetingCode: r.meeting_code,
            sender: {
              id: r.sender_id,
              name: r.sender_name,
              role: r.sender_role,
              isUser: r.is_user,
              isBot: r.is_bot
            },
            text: r.text,
            timestamp: r.timestamp_label,
            commitmentDetails: typeof r.commitment_details === 'string' ? JSON.parse(r.commitment_details) : r.commitment_details,
            createdAt: r.created_at
          }));
        }
      } catch (err) {
        console.warn('[MeetingRepo] Error reading chat messages from DB:', err.message);
      }
    }

    const list = loadFallbackMeetings();
    const target = list.find(m => m.id === meetingId || m.code?.toUpperCase() === targetCode || m.code?.toUpperCase() === cleanCode);
    if (target && Array.isArray(target.chatMessages)) {
      return target.chatMessages.map(m => ({
        id: m.id,
        meetingId: m.meeting_id || target.id,
        meetingCode: m.meeting_code || target.code,
        sender: {
          id: m.sender_id || m.sender?.id,
          name: m.sender_name || m.sender?.name || 'Attendee',
          role: m.sender_role || m.sender?.role || 'Participant',
          isUser: m.is_user ?? m.sender?.isUser ?? true,
          isBot: m.is_bot ?? m.sender?.isBot ?? false
        },
        text: m.text,
        timestamp: m.timestamp_label || m.timestamp || 'Just now',
        commitmentDetails: m.commitment_details || m.commitmentDetails,
        createdAt: m.created_at || m.createdAt
      }));
    }
    return [];
  },

  async saveChatReport(meetingIdentifier, report, actionItems = []) {
    const now = new Date().toISOString();
    const meeting = await this.findByIdOrCode(meetingIdentifier);
    if (!meeting) return null;

    if (isPostgresConnected()) {
      try {
        await query(
          `UPDATE meetings 
           SET report_data = $1, summary = $2, status = 'completed', updated_at = $3
           WHERE id = $4 OR UPPER(meeting_code) = $5`,
          [
            JSON.stringify(report),
            report.executiveSummary || 'Live Chat Session Completed.',
            now,
            meeting.id,
            meeting.code.toUpperCase()
          ]
        );

        // Persist extracted action items into action_items table
        if (Array.isArray(actionItems) && actionItems.length > 0) {
          for (let i = 0; i < actionItems.length; i++) {
            const act = actionItems[i];
            await query(
              `INSERT INTO action_items (id, meeting_id, task, owner, deadline, status, confidence, speaker, timestamp_label, evidence_quote, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT (id) DO UPDATE 
               SET task = EXCLUDED.task, owner = EXCLUDED.owner, deadline = EXCLUDED.deadline, status = EXCLUDED.status`,
              [
                act.id || `act_${meeting.id}_${i}_${Math.random().toString(36).substr(2, 4)}`,
                meeting.id,
                act.task || 'Unspecified Task',
                act.owner || 'Needs Clarification',
                act.deadline || 'Not specified',
                act.status || 'Committed',
                act.confidence || 'High',
                act.speaker || act.owner || 'Participant',
                act.timestamp || '00:00',
                act.evidence?.quote || act.evidence || act.task,
                now
              ]
            );
          }
        }
      } catch (err) {
        console.warn('[MeetingRepo] Error persisting chat report to DB:', err.message);
      }
    }

    const list = loadFallbackMeetings();
    const target = list.find(m => m.id === meeting.id || m.code?.toUpperCase() === meeting.code?.toUpperCase());
    if (target) {
      target.report = report;
      target.summary = report.executiveSummary;
      target.status = 'completed';
      target.updatedAt = now;
      saveFallbackMeetings(list);
    }

    return this.findByIdOrCode(meeting.id);
  },

  _mapPgRowToMeeting(r) {
    return {
      id: r.id,
      code: r.meeting_code,
      title: r.title,
      owner_id: r.owner_id,
      client: r.client_name,
      organization: r.organization,
      type: r.meeting_type,
      status: r.status,
      isDemo: !!r.is_demo,
      duration: r.duration,
      rawDurationSec: r.raw_duration_sec,
      summary: r.summary,
      report: typeof r.report_data === 'string' ? JSON.parse(r.report_data) : r.report_data,
      audioMetrics: typeof r.audio_metrics === 'string' ? JSON.parse(r.audio_metrics) : r.audio_metrics,
      audioUrl: r.audio_url,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
};

export default meetingRepository;
