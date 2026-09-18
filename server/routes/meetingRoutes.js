import express from 'express';
import { meetingController } from '../controllers/meetingController.js';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, meetingController.getMeetings);
router.post('/', optionalAuth, meetingController.createMeeting);
router.post('/load-demo', meetingController.loadDemo);
router.post('/reset', meetingController.resetMeetings);

router.get('/:code', optionalAuth, meetingController.getMeetingByIdOrCode);
router.post('/:code/join', meetingController.joinMeeting);
router.get('/:code/messages', optionalAuth, meetingController.getChatMessages);
router.post('/:code/messages', optionalAuth, meetingController.sendChatMessage);
router.post('/:code/analyze', optionalAuth, meetingController.analyzeChatMeeting);
router.get('/:id/report', optionalAuth, meetingController.getReport);
router.get('/:id/transcript', optionalAuth, meetingController.getTranscript);

export default router;
