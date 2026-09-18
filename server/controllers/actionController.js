import { actionRepository } from '../repositories/actionRepository.js';
import { meetingRepository } from '../repositories/meetingRepository.js';

export const actionController = {
  async getActions(req, res) {
    try {
      const userId = req.user ? req.user.id : 'usr_anonymous';
      const role = req.user ? req.user.role : 'user';
      const actions = await actionRepository.findForUser(userId, role);
      res.json(actions);
    } catch (err) {
      console.error('[Get Actions Error]', err);
      res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: err.message } });
    }
  },

  async getActionById(req, res) {
    try {
      const action = await actionRepository.findById(req.params.id);
      if (!action) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Action item not found.' } });
      }

      // Check meeting ownership/participation
      if (req.user && req.user.role !== 'admin') {
        const meeting = await meetingRepository.findById(action.meetingId);
        if (meeting && meeting.owner_id !== req.user.id && !meeting.isDemo && !meeting.is_demo) {
          return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
        }
      }

      res.json(action);
    } catch (err) {
      res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: err.message } });
    }
  },

  async updateAction(req, res) {
    try {
      const action = await actionRepository.findById(req.params.id);
      if (!action) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Action item not found.' } });
      }

      // Verify authorization: must own the meeting or be admin
      if (req.user && req.user.role !== 'admin') {
        const meeting = await meetingRepository.findById(action.meetingId);
        if (meeting && meeting.owner_id !== req.user.id && !meeting.isDemo && !meeting.is_demo) {
          return res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this action item.' }
          });
        }
      }

      const updated = await actionRepository.update(req.params.id, req.body);
      res.json({ success: true, action: updated });
    } catch (err) {
      console.error('[Update Action Error]', err);
      res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message: err.message } });
    }
  },

  async createAction(req, res) {
    try {
      const created = await actionRepository.create(req.body);
      res.status(201).json({ success: true, action: created });
    } catch (err) {
      console.error('[Create Action Error]', err);
      res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message: err.message } });
    }
  }
};

export default actionController;
