import { meetingRepository } from '../repositories/meetingRepository.js';

/**
 * Checks that the authenticated user owns or participates in the target meeting.
 */
export function requireMeetingAccess(idParam = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    const meetingIdentifier = req.params[idParam];
    if (!meetingIdentifier) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Missing meeting identifier in request.' }
      });
    }

    const meeting = await meetingRepository.findByIdOrCode(meetingIdentifier);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found.' }
      });
    }

    // Admins have universal access
    if (req.user.role === 'admin') {
      req.meeting = meeting;
      return next();
    }

    // Owner access
    if (meeting.owner_id === req.user.id) {
      req.meeting = meeting;
      return next();
    }

    // Participant access check
    const isParticipant = Array.isArray(meeting.participants) && meeting.participants.some(p => 
      p.user_id === req.user.id || 
      (p.id && p.id === req.user.id) ||
      (p.email && p.email.toLowerCase() === req.user.email.toLowerCase())
    );

    if (isParticipant || meeting.is_demo) {
      req.meeting = meeting;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have authorization to access this meeting.'
      }
    });
  };
}

/**
 * Checks that the authenticated user is the strict owner of the meeting.
 */
export function requireMeetingOwnership(idParam = 'id') {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    const meetingIdentifier = req.params[idParam];
    const meeting = await meetingRepository.findByIdOrCode(meetingIdentifier);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        error: { code: 'MEETING_NOT_FOUND', message: 'Meeting not found.' }
      });
    }

    if (req.user.role === 'admin' || meeting.owner_id === req.user.id) {
      req.meeting = meeting;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Only the meeting owner may perform this action.'
      }
    });
  };
}

/**
 * Role-based authorization middleware.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions. Required role: ${roles.join(' or ')}`
        }
      });
    }

    next();
  };
}

export default { requireMeetingAccess, requireMeetingOwnership, requireRole };
