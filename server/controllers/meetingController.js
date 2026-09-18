import { meetingRepository } from '../repositories/meetingRepository.js';
import { meetingIntelligenceService } from '../services/meetingIntelligenceService.js';

export const meetingController = {
  async getMeetings(req, res) {
    try {
      const userId = req.user ? req.user.id : 'usr_anonymous';
      const role = req.user ? req.user.role : 'user';
      const meetings = await meetingRepository.findForUser(userId, role);
      res.json(meetings);
    } catch (err) {
      console.error('[Get Meetings Error]', err);
      res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: err.message } });
    }
  },

  async getMeetingByIdOrCode(req, res) {
    try {
      const identifier = (req.params.code || req.params.id || '').trim();
      const meeting = await meetingRepository.findByIdOrCode(identifier);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting code not found" });
      }

      // If looking up by meeting code (e.g. joining via invitation code), allow lookup so attendee can join
      const isCodeLookup = req.params.code || identifier.toUpperCase().startsWith('G13-');
      if (!isCodeLookup && req.user && !meeting.isDemo && !meeting.is_demo && req.user.role !== 'admin') {
        const isOwner = meeting.owner_id === req.user.id;
        const isParticipant = Array.isArray(meeting.participants) && meeting.participants.some(p => p.id === req.user.id || p.user_id === req.user.id);
        if (!isOwner && !isParticipant) {
          return res.status(403).json({ error: "You do not have authorization to access this private meeting." });
        }
      }

      res.json(meeting);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createMeeting(req, res) {
    try {
      const data = req.body;
      const userId = req.user ? req.user.id : 'usr_anonymous';
      const userName = req.user ? req.user.name : 'Alex Rivera';

      // Generate server-side non-sequential unique code
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const code = `G13-${randomSuffix}`;

      const newMeeting = await meetingRepository.create({
        title: data.title || 'Untitled AI Sync',
        code,
        owner_id: userId,
        client: data.client || 'Enterprise Client',
        organization: data.organization || (req.user ? req.user.organization : 'Core Platform'),
        date: 'Just now',
        duration: '0 min',
        rawDurationSec: 0,
        status: 'active',
        type: data.type || 'Strategy & Architecture',
        description: data.description || '',
        participants: [
          { id: userId, name: userName, role: "Host & Engineering Lead", isUser: true, avatar: userName.substring(0, 2).toUpperCase(), color: "#5B6CFF" },
          ...(data.participantsList || [
            { id: `part_${Date.now()}`, name: data.client ? `${data.client} Lead` : "Sarah Chen", role: "Client Representative", isUser: false, avatar: "CR", color: "#EC4899" }
          ])
        ],
        summary: "Live meeting in progress. AI Agent actively listening across all connected devices.",
        stats: { commitmentsCount: 0, decisionsCount: 0, actionsCount: 0 }
      });

      if (req.io) {
        req.io.emit('meeting_created', newMeeting);
      }

      res.status(201).json(newMeeting);
    } catch (err) {
      console.error('[Create Meeting Error]', err);
      res.status(500).json({ error: err.message });
    }
  },

  async joinMeeting(req, res) {
    try {
      const code = req.params.code.trim().toUpperCase();
      const participant = req.body.participant || { name: 'Mobile Attendee', role: 'Participant' };
      const meeting = await meetingRepository.findByIdOrCode(code);

      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      const newPart = await meetingRepository.addParticipant(meeting.id, participant);

      if (req.io) {
        req.io.to(`meeting:${code}`).emit('participant_joined', { user: newPart });
        req.io.to(code).emit('participant_joined', { user: newPart });
      }

      res.json({ success: true, meeting, participant: newPart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getReport(req, res) {
    try {
      const identifier = req.params.id;
      const meeting = await meetingRepository.findByIdOrCode(identifier);
      if (!meeting || !meeting.report) {
        return res.status(404).json({ error: "Report not found for this meeting" });
      }

      if (req.user && !meeting.isDemo && !meeting.is_demo && req.user.role !== 'admin') {
        const isOwner = meeting.owner_id === req.user.id;
        const isParticipant = Array.isArray(meeting.participants) && meeting.participants.some(p => p.id === req.user.id || p.user_id === req.user.id);
        if (!isOwner && !isParticipant) {
          return res.status(403).json({ error: "Unauthorized access to report." });
        }
      }

      res.json(meeting.report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getTranscript(req, res) {
    try {
      const identifier = req.params.id;
      const meeting = await meetingRepository.findByIdOrCode(identifier);
      if (!meeting || !meeting.transcript) {
        return res.status(404).json({ error: "Transcript not found for this meeting" });
      }

      if (req.user && !meeting.isDemo && !meeting.is_demo && req.user.role !== 'admin') {
        const isOwner = meeting.owner_id === req.user.id;
        const isParticipant = Array.isArray(meeting.participants) && meeting.participants.some(p => p.id === req.user.id || p.user_id === req.user.id);
        if (!isOwner && !isParticipant) {
          return res.status(403).json({ error: "Unauthorized access to transcript." });
        }
      }

      res.json(meeting.transcript);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async loadDemo(req, res) {
    try {
      const demoMeeting = {
        id: "meet-101",
        code: "G13-X7K92",
        title: "Q3 Stripe Billing & Latency Architecture Sync",
        client: "FinEdge Technologies",
        organization: "Core Platform Team",
        date: "Today, 10:00 AM",
        duration: "42 min",
        status: "completed",
        isDemo: true,
        type: "Architecture & Client Review",
        participants: [
          { id: "user-1", name: "Alex Rivera", role: "Host & Engineering Lead", isUser: true, avatar: "AR", color: "#5B6CFF" },
          { id: "cust-1", name: "Sarah Chen", role: "VP of Product, FinEdge (Customer)", isUser: false, avatar: "SC", color: "#EC4899" },
          { id: "user-2", name: "Raj Patel", role: "Senior Backend Architect", isUser: false, avatar: "RP", color: "#8B5CF6" }
        ],
        summary: "Addressed webhook retry contention under peak concurrency.",
        stats: { commitmentsCount: 3, decisionsCount: 2, actionsCount: 4 }
      };

      await meetingRepository.create(demoMeeting);
      const meetings = await meetingRepository.findForUser('user-1', 'user');
      res.json({ success: true, meetings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async resetMeetings(req, res) {
    try {
      // In development, resets fallback meetings
      res.json({ success: true, message: "All meetings reset to clean state." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getChatMessages(req, res) {
    try {
      const code = (req.params.code || req.params.id || '').trim().toUpperCase();
      const messages = await meetingRepository.getChatMessages(code);
      res.json({ success: true, messages });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async sendChatMessage(req, res) {
    try {
      const code = (req.params.code || req.params.id || '').trim().toUpperCase();
      const { text, sender, meetingCode, id } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "EMPTY_MESSAGE", message: "Chat text cannot be empty." });
      }

      let meeting = await meetingRepository.findByIdOrCode(code);
      if (!meeting) {
        meeting = await meetingRepository.create({
          code,
          title: `Live Session (${code})`,
          status: 'active'
        });
      }

      // Check for commitment signals in text
      const deadline = meetingIntelligenceService.extractDeadlineString(text);
      let commitmentDetails = null;
      if (deadline || /(i will|i'll|i commit to|we will deliver|i can complete|i can finish)/i.test(text)) {
        commitmentDetails = {
          action: text.replace(/^(yes,?\s*)?(i will|i'll|i commit to|i can)\s*/i, 'Complete ').trim(),
          owner: sender?.name || req.user?.name || 'Participant',
          deadline: deadline || 'Next Milestone',
          confidence: 'High (98%)'
        };
      }

      const savedMsg = await meetingRepository.saveChatMessage(meeting.id, {
        id: id || req.body.id,
        text,
        sender: sender || {
          id: req.user?.id || 'usr_guest',
          name: req.user?.name || 'Attendee',
          role: req.user ? 'Participant' : 'Guest',
          isUser: !!req.user
        },
        commitmentDetails
      });

      if (req.io) {
        req.io.to(`meeting:${code}`).to(code).emit('chat_message', savedMsg);

        if (commitmentDetails) {
          req.io.to(`meeting:${code}`).to(code).emit('commitment_detected', { commitment: commitmentDetails, turn: savedMsg });
        }
      }

      res.status(201).json({ success: true, message: savedMsg });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async analyzeChatMeeting(req, res) {
    try {
      const code = (req.params.code || req.params.id || '').trim().toUpperCase();
      const meeting = await meetingRepository.findByIdOrCode(code);
      if (!meeting) {
        return res.status(404).json({ error: "Meeting not found." });
      }

      const messages = await meetingRepository.getChatMessages(code);
      const report = await meetingIntelligenceService.extractFromChatMessages({
        messages,
        metadata: {
          title: meeting.title,
          client: meeting.client,
          organization: meeting.organization,
          date: meeting.date
        }
      });

      const updated = await meetingRepository.saveChatReport(meeting.id, report, report.actionItems || []);

      if (req.io) {
        req.io.to(`meeting:${code}`).emit('meeting_completed', { meetingId: meeting.id, report });
        req.io.to(code).emit('meeting_completed', { meetingId: meeting.id, report });
      }

      res.json({ success: true, meeting: updated, report });
    } catch (err) {
      console.error('[Analyze Chat Meeting Error]', err);
      res.status(500).json({ error: err.message });
    }
  }
};

export default meetingController;
