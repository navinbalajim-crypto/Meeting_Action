import express from 'express';
import multer from 'multer';
import { voiceProfileController } from '../controllers/voiceProfileController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });
const router = express.Router();

router.post('/enroll', upload.array('voice_samples', 3), optionalAuth, voiceProfileController.enroll);
router.get('/', optionalAuth, voiceProfileController.getProfile);
router.delete('/', optionalAuth, voiceProfileController.deleteProfile);

export default router;
