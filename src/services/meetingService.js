import { INITIAL_MEETINGS } from '../data/demoMeetings';
import { api } from './api';

const MEETINGS_STORAGE_KEY = 'g13_meetings_store';

function getStoredMeetings() {
  const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(INITIAL_MEETINGS));
    return INITIAL_MEETINGS;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEETINGS;
  }
}

export const meetingService = {
  async getAllMeetings() {
    try {
      const serverMeetings = await api.get('/meetings');
      if (Array.isArray(serverMeetings) && serverMeetings.length > 0) {
        localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(serverMeetings));
        return serverMeetings;
      }
    } catch (e) {
      // fallback to local cache
    }
    return getStoredMeetings();
  },

  async getMeetings() {
    return this.getAllMeetings();
  },

  async getMeetingByCode(code) {
    const formatted = (code || '').trim().toUpperCase();
    
    // First check local cache
    const list = getStoredMeetings();
    const localMatch = list.find(m => m.code.toUpperCase() === formatted || m.id === formatted);

    // Also query backend server so phone can find meetings created on other devices!
    try {
      const remoteMeeting = await api.get(`/meetings/${formatted}`);
      if (remoteMeeting && remoteMeeting.code) {
        // Update local cache with remote meeting
        const existing = list.filter(m => m.code.toUpperCase() !== formatted);
        localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify([remoteMeeting, ...existing]));
        return remoteMeeting;
      }
    } catch (err) {
      console.log(`[MeetingService] Remote lookup note for ${formatted}:`, err.message);
    }

    return localMatch || null;
  },

  async createMeeting(data) {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `G13-${randomSuffix}`;
    const newMeeting = {
      id: `meet-${Date.now()}`,
      code: code,
      title: data.title || 'Untitled AI Sync',
      client: data.client || 'Enterprise Client',
      organization: data.organization || 'General Engineering',
      date: 'Just now',
      duration: '0 min',
      status: 'active',
      type: data.type || 'Strategy & Architecture',
      description: data.description || '',
      participants: [
        { id: "user-1", name: "Alex Rivera", role: "Host & Engineering Lead", isUser: true, avatar: "AR", color: "#5B6CFF" },
        ...(data.participantsList || [
          { id: "cust-1", name: data.client ? `${data.client} Lead` : "Sarah Chen", role: "Client Representative", isUser: false, avatar: "CR", color: "#EC4899" },
          { id: "user-2", name: "Raj Patel", role: "Senior Backend Architect", isUser: false, avatar: "RP", color: "#8B5CF6" }
        ])
      ],
      summary: "Live meeting in progress. AI Agent actively listening and parsing speaker commitments.",
      stats: {
        commitmentsCount: 0,
        decisionsCount: 0,
        actionsCount: 0,
        contradictionsCount: 0,
        unresolvedCount: 0
      }
    };

    // Save locally
    const current = getStoredMeetings();
    const updated = [newMeeting, ...current];
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(updated));

    // Post to backend server for cross-device visibility
    try {
      await api.post('/meetings', newMeeting);
    } catch (e) {
      console.warn('[MeetingService] Offline save only, backend not reached');
    }

    return newMeeting;
  },

  async joinMeeting(code, participant) {
    const formatted = (code || '').trim().toUpperCase();
    try {
      const res = await api.post(`/meetings/${formatted}/join`, { participant });
      return res;
    } catch (e) {
      return { success: true };
    }
  },

  async getChatMessages(code) {
    const formatted = (code || '').trim().toUpperCase();
    try {
      const res = await api.get(`/meetings/${formatted}/messages`);
      return res.messages || [];
    } catch (e) {
      console.warn('[MeetingService] Could not fetch remote chat messages:', e.message);
      return [];
    }
  },

  async sendChatMessage(code, messageData) {
    const formatted = (code || '').trim().toUpperCase();
    try {
      const res = await api.post(`/meetings/${formatted}/messages`, {
        meetingCode: formatted,
        ...messageData
      });
      return res.message;
    } catch (e) {
      console.warn('[MeetingService] Error sending chat message to API:', e.message);
      return null;
    }
  },

  async analyzeChatMeeting(code) {
    const formatted = (code || '').trim().toUpperCase();
    try {
      const res = await api.post(`/meetings/${formatted}/analyze`);
      return res;
    } catch (e) {
      console.warn('[MeetingService] Error requesting AI chat meeting analysis:', e.message);
      throw e;
    }
  },

  async getNetworkInfo() {
    try {
      return await api.get('/network-info');
    } catch (e) {
      return { localIp: window.location.hostname, port: 3000 };
    }
  }
};

export default meetingService;
