import { io } from 'socket.io-client';
import { LIVE_DEMO_TRANSCRIPT } from '../data/demoTranscripts';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

class SocketService {
  constructor() {
    this.socket = null;
    this.status = 'Ready'; // Ready, Connecting, Connected, Disconnected, Processing
    this.listeners = new Map();
    this.simulationTimer = null;
    this.isSimulating = false;
  }

  connect(meetingCode = 'G13-X7K92') {
    const cleanCode = (meetingCode || 'G13-X7K92').trim().toUpperCase();
    this.currentMeetingCode = cleanCode;

    if (this.socket && this.socket.connected) {
      this.socket.emit('join_meeting', { meetingCode: cleanCode });
      return;
    }

    this.setStatus('Connecting');

    try {
      this.socket = io(SOCKET_SERVER_URL, {
        transports: ['websocket', 'polling'],
        timeout: 4000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        this.setStatus('Connected');
        this.emitToListeners('status_change', 'Connected');
        this.socket.emit('join_meeting', { meetingCode: this.currentMeetingCode });
      });

      this.socket.on('disconnect', () => {
        this.setStatus('Disconnected');
        this.emitToListeners('status_change', 'Disconnected');
      });

      this.socket.on('connect_error', () => {
        // Gracefully handle local offline/demo mode
        this.setStatus('Ready');
        this.emitToListeners('status_change', 'Ready');
      });

      this.socket.on('transcript_turn', (data) => {
        this.emitToListeners('transcript_turn', data);
      });

      this.socket.on('commitment_detected', (data) => {
        this.emitToListeners('commitment_detected', data);
      });

      this.socket.on('chat_message', (data) => {
        this.emitToListeners('chat_message', data);
      });

      this.socket.on('chat_history', (data) => {
        this.emitToListeners('chat_history', data);
      });

      this.socket.on('participant_joined', (data) => {
        this.emitToListeners('participant_joined', data);
      });
    } catch {
      this.setStatus('Ready');
    }
  }

  requestChatHistory(meetingCode) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('get_chat_history', { meetingCode: meetingCode || this.currentMeetingCode });
    }
  }

  sendChatMessage(meetingCode, message) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('chat_message', { meetingCode, message });
    }
  }

  disconnect() {
    this.stopSimulation();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setStatus('Disconnected');
  }

  setStatus(status) {
    this.status = status;
    this.emitToListeners('status_change', status);
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const filtered = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, filtered);
  }

  emitToListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in listener for ${event}:`, e);
        }
      });
    }
  }

  // High-fidelity Live Meeting Streaming Simulation for Hackathon / Demos
  startDemoSimulation(onTurnReceived, onCommitmentDetected, onComplete) {
    this.stopSimulation();
    this.isSimulating = true;
    this.setStatus('Processing');

    let currentIndex = 0;
    const intervalMs = 2600; // 2.6 seconds per realistic conversation turn

    this.simulationTimer = setInterval(() => {
      if (currentIndex >= LIVE_DEMO_TRANSCRIPT.length) {
        this.stopSimulation();
        this.setStatus('Ready');
        if (onComplete) onComplete();
        return;
      }

      const turn = LIVE_DEMO_TRANSCRIPT[currentIndex];
      
      // Emit speaker active state
      this.emitToListeners('speaker_active', {
        speakerId: turn.speakerId,
        speakerName: turn.speakerName,
        isUser: turn.isUser
      });

      // Emit turn
      if (onTurnReceived) {
        onTurnReceived(turn);
      }
      this.emitToListeners('transcript_turn', turn);

      // Check if this turn contains an extracted commitment
      if (turn.commitmentDetails && onCommitmentDetected) {
        setTimeout(() => {
          onCommitmentDetected(turn.commitmentDetails, turn);
        }, 700);
      }

      currentIndex++;
    }, intervalMs);
  }

  stopSimulation() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
    this.isSimulating = false;
  }
}

export const socketService = new SocketService();
export default socketService;
