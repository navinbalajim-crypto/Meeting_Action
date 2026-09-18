import express from 'express';
import { actionController } from '../controllers/actionController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, actionController.getActions);
router.post('/', optionalAuth, actionController.createAction);
router.get('/:id', optionalAuth, actionController.getActionById);
router.patch('/:id', optionalAuth, actionController.updateAction);

export default router;
