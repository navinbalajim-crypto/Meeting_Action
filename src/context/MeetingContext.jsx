import React, { createContext, useContext, useState, useEffect } from 'react';
import { meetingService } from '../services/meetingService';
import { INITIAL_ACTIONS, INITIAL_MEETINGS } from '../data/demoMeetings';
import { LIVE_DEMO_TRANSCRIPT } from '../data/demoTranscripts';
import { socketService } from '../services/socketService';
import { intelligenceService } from '../services/intelligenceService';
import confetti from 'canvas-confetti';

const MeetingContext = createContext(null);

const STORAGE_MEETINGS_KEY = 'g13_user_meetings';
const STORAGE_ACTIONS_KEY = 'g13_user_actions';

export const MeetingProvider = ({ children }) => {
  // Initialize from persistent user storage, or clean empty state by default
  const [meetings, setMeetings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MEETINGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeMeeting, setActiveMeeting] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_MEETINGS_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.length > 0 ? parsed[0] : null;
    } catch (e) {
      return null;
    }
  });

  const [actions, setActions] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [transcriptTurns, setTranscriptTurns] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [socketStatus, setSocketStatus] = useState('Ready');
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveCommitments, setLiveCommitments] = useState([]);

  // Evidence Modal state
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  // RAG / Contradiction Drawer state
  const [ragDrawerOpen, setRagDrawerOpen] = useState(false);
  const [selectedContradiction, setSelectedContradiction] = useState(null);

  // Sync meetings from server on mount
  useEffect(() => {
    const fetchInitialMeetings = async () => {
      try {
        if (typeof meetingService?.getAllMeetings === 'function') {
          const remoteMeetings = await meetingService.getAllMeetings();
          if (Array.isArray(remoteMeetings) && remoteMeetings.length > 0) {
            setMeetings((prev) => {
              const map = new Map();
              for (const m of remoteMeetings) map.set(m.code || m.id, m);
              for (const m of prev) {
                if (!map.has(m.code || m.id)) map.set(m.code || m.id, m);
              }
              return Array.from(map.values());
            });

            setActiveMeeting((current) => {
              if (current) return current;
              return remoteMeetings[0];
            });
          }
        }
      } catch (e) {
        console.warn('[MeetingContext] Could not load initial meetings:', e.message);
      }
    };

    fetchInitialMeetings();
  }, []);

  useEffect(() => {
    // Listen to socket status changes
    const unsubStatus = socketService.on('status_change', (status) => {
      setSocketStatus(status);
    });

    const unsubSpeaker = socketService.on('speaker_active', (data) => {
      setActiveSpeakerId(data.speakerId);
    });

    const unsubChat = socketService.on('chat_message', (msg) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Also mirror to transcript turns for real-time RAG / evidence
      setTranscriptTurns((prev) => {
        if (prev.some((t) => t.id === msg.id)) return prev;
        return [
          ...prev,
          {
            id: msg.id,
            speakerId: msg.sender?.id || 'usr',
            speakerName: msg.sender?.name || 'Attendee',
            speakerRole: msg.sender?.role || 'Participant',
            isUser: !!msg.sender?.isUser,
            isBot: !!msg.sender?.isBot,
            timestamp: msg.timestamp || '00:00',
            text: msg.text,
            commitmentDetails: msg.commitmentDetails
          }
        ];
      });
    });

    const unsubHistory = socketService.on('chat_history', (data) => {
      if (data?.messages && Array.isArray(data.messages)) {
        setChatMessages((prev) => {
          const map = new Map();
          for (const m of data.messages) map.set(m.id, m);
          for (const m of prev) {
            if (!map.has(m.id)) map.set(m.id, m);
          }
          return Array.from(map.values()).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        });
      }
    });

    const unsubCommitment = socketService.on('commitment_detected', (data) => {
      if (data?.commitment) {
        setLiveCommitments((prev) => [
          {
            ...data.commitment,
            id: `comm-live-${Date.now()}`,
            timestamp: data.turn?.timestamp || '00:00',
            evidence: {
              quote: data.turn?.text || data.commitment.action,
              speaker: data.turn?.sender?.name || data.commitment.owner,
              timestamp: data.turn?.timestamp || '00:00'
            }
          },
          ...prev
        ]);
      }
    });

    return () => {
      unsubStatus();
      unsubSpeaker();
      unsubChat();
      unsubHistory();
      unsubCommitment();
    };
  }, []);

  // Fetch persisted chat messages and connect socket on active meeting switch
  useEffect(() => {
    if (activeMeeting?.code) {
      const cleanCode = activeMeeting.code.trim().toUpperCase();
      socketService.connect(cleanCode);

      meetingService.getChatMessages(cleanCode).then((msgs) => {
        if (Array.isArray(msgs)) {
          setChatMessages((prev) => {
            const map = new Map();
            for (const m of prev) {
              if (m.meetingCode === cleanCode) map.set(m.id, m);
            }
            for (const m of msgs) map.set(m.id, m);
            return Array.from(map.values()).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
          });
        }
      });
    }
  }, [activeMeeting?.code]);

  const openEvidence = (evidenceData) => {
    setSelectedEvidence(evidenceData);
    setEvidenceModalOpen(true);
  };

  const closeEvidence = () => {
    setEvidenceModalOpen(false);
    setSelectedEvidence(null);
  };

  const openContradiction = (contradictionData) => {
    setSelectedContradiction(contradictionData);
    setRagDrawerOpen(true);
  };

  const closeContradiction = () => {
    setRagDrawerOpen(false);
    setSelectedContradiction(null);
  };

  const createMeeting = async (data) => {
    const newMeet = await meetingService.createMeeting(data);
    setMeetings((prev) => [newMeet, ...prev]);
    setActiveMeeting(newMeet);
    socketService.connect(newMeet.code);
    return newMeet;
  };

  const joinMeetingByCode = async (code) => {
    const cleanCode = (code || '').trim().toUpperCase();
    let found = await meetingService.getMeetingByCode(cleanCode);
    if (!found) {
      found = meetings.find(m => m.code?.toUpperCase() === cleanCode);
    }
    if (found) {
      setMeetings((prev) => {
        if (prev.some(m => m.code?.toUpperCase() === cleanCode)) return prev;
        return [found, ...prev];
      });
      setActiveMeeting(found);
      socketService.connect(found.code);
      const msgs = await meetingService.getChatMessages(found.code);
      if (Array.isArray(msgs)) {
        setChatMessages(msgs);
      }
      return { success: true, meeting: found };
    }
    return { success: false, error: 'Meeting code not found or session has expired.' };
  };

  const updateActionStatus = (actionId, newStatus) => {
    setActions((prev) =>
      prev.map((act) => {
        if (act.id === actionId) {
          if (newStatus === 'Completed') {
            // Trigger celebratory confetti on commitment fulfillment!
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#10B981', '#5B6CFF', '#4FD1FF']
              });
            } catch (e) {
              // ignore
            }
          }
          return { ...act, status: newStatus };
        }
        return act;
      })
    );
  };

  const registerCompletedMeeting = (newMeeting) => {
    if (!newMeeting) return;

    setMeetings((prev) => {
      const exists = prev.some(m => m.id === newMeeting.id || m.code === newMeeting.code);
      if (exists) {
        return prev.map(m => (m.id === newMeeting.id || m.code === newMeeting.code) ? newMeeting : m);
      }
      return [newMeeting, ...prev];
    });

    setActiveMeeting(newMeeting);

    if (newMeeting.transcript && Array.isArray(newMeeting.transcript)) {
      setTranscriptTurns(newMeeting.transcript);
    }

    // Auto-sync extracted actions to Action Tracker
    if (newMeeting.report?.actionItems && Array.isArray(newMeeting.report.actionItems)) {
      const formattedActions = newMeeting.report.actionItems.map((item, idx) => ({
        id: item.id || `act-upload-${Date.now()}-${idx}`,
        task: item.task,
        owner: item.owner || 'Needs Clarification',
        deadline: item.deadline || 'Not specified',
        status: item.status || 'Committed',
        confidence: item.confidence || 'High',
        speaker: item.speaker || 'Identified Speaker',
        timestamp: item.timestamp || '00:00',
        evidence: item.evidence || {
          quote: item.evidence?.quote || item.task,
          speaker: item.evidence?.speaker || item.speaker,
          timestamp: item.evidence?.timestamp || item.timestamp
        },
        meetingTitle: newMeeting.title || 'Uploaded Meeting',
        meetingDate: newMeeting.date || 'Today'
      }));

      setActions((prev) => {
        const existingTasks = new Set(prev.map(a => a.task.toLowerCase().trim()));
        const uniqueNew = formattedActions.filter(a => !existingTasks.has(a.task.toLowerCase().trim()));
        return [...uniqueNew, ...prev];
      });
    }
  };

  // Auto-sync meetings & actions to persistent storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MEETINGS_KEY, JSON.stringify(meetings));
    } catch (e) {}
  }, [meetings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIONS_KEY, JSON.stringify(actions));
    } catch (e) {}
  }, [actions]);

  const loadDemoMeeting = () => {
    const demoMeet = { ...INITIAL_MEETINGS[0], isDemo: true };
    setMeetings([demoMeet]);
    setActiveMeeting(demoMeet);
    setActions(INITIAL_ACTIONS.map(a => ({ ...a, isDemo: true })));
  };

  const clearAllMeetings = () => {
    setMeetings([]);
    setActiveMeeting(null);
    setActions([]);
    setTranscriptTurns([]);
    try {
      localStorage.removeItem(STORAGE_MEETINGS_KEY);
      localStorage.removeItem(STORAGE_ACTIONS_KEY);
    } catch (e) {}
  };

  const startLiveSimulation = (onCommitment) => {
    setIsLiveActive(true);
    setTranscriptTurns([]);
    setLiveCommitments([]);

    socketService.startDemoSimulation(
      (turn) => {
        setTranscriptTurns((prev) => [...prev, turn]);
      },
      (commitment, turn) => {
        setLiveCommitments((prev) => [
          {
            ...commitment,
            id: `comm-live-${Date.now()}`,
            turnId: turn.id,
            timestamp: turn.timestamp,
            evidence: {
              quote: turn.text,
              speaker: turn.speakerName,
              timestamp: turn.timestamp
            }
          },
          ...prev
        ]);
        if (onCommitment) onCommitment(commitment, turn);
      },
      () => {
        setIsLiveActive(false);
        setActiveSpeakerId(null);
      }
    );
  };

  const stopLiveSimulation = () => {
    socketService.stopSimulation();
    setIsLiveActive(false);
    setActiveSpeakerId(null);
  };

  const sendChatMessage = async (text, currentUser) => {
    if (!activeMeeting?.code || !text || text.trim().length === 0) return null;

    let guestId = null;
    try {
      guestId = localStorage.getItem('g13_guest_id');
      if (!guestId) {
        guestId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        localStorage.setItem('g13_guest_id', guestId);
      }
    } catch (e) {
      guestId = `usr_${Date.now()}`;
    }

    const senderName = currentUser?.name || 'Attendee';
    const senderObj = {
      id: currentUser?.id || guestId,
      name: senderName,
      role: currentUser?.role || 'Participant',
      isUser: true,
      avatar: senderName.substring(0, 2).toUpperCase()
    };

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const tempMsg = {
      id: msgId,
      meetingCode: activeMeeting.code.toUpperCase(),
      sender: senderObj,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };

    // Optimistic local add
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      return [...prev, tempMsg];
    });

    // Send via WebSocket
    socketService.sendChatMessage(activeMeeting.code.toUpperCase(), tempMsg);

    // Also persist via REST API
    try {
      await meetingService.sendChatMessage(activeMeeting.code.toUpperCase(), {
        id: msgId,
        text: text.trim(),
        sender: senderObj,
        meetingCode: activeMeeting.code.toUpperCase()
      });
    } catch (e) {
      console.warn('[MeetingContext] REST send error:', e.message);
    }

    return tempMsg;
  };

  const endMeetingAndGenerateReport = async () => {
    if (!activeMeeting?.code) return null;

    try {
      const res = await meetingService.analyzeChatMeeting(activeMeeting.code);
      if (res && res.report) {
        const completedMeeting = {
          ...activeMeeting,
          status: 'completed',
          report: res.report,
          summary: res.report.executiveSummary,
          chatMessages
        };

        registerCompletedMeeting(completedMeeting);
        return completedMeeting;
      }
    } catch (err) {
      console.warn('[MeetingContext] Error generating AI chat report via API, using local intelligence engine:', err);
    }

    // Local intelligence synthesis fallback
    const localReport = intelligenceService.generateReportFromTranscript(
      chatMessages.map((m, idx) => ({
        id: m.id || idx,
        speakerId: m.sender?.id || 'user',
        speakerName: m.sender?.name || 'Attendee',
        text: m.text,
        timestamp: m.timestamp || '00:00'
      })),
      {
        id: activeMeeting.id,
        title: activeMeeting.title,
        client: activeMeeting.client,
        organization: activeMeeting.organization
      }
    );

    const completed = {
      ...activeMeeting,
      status: 'completed',
      report: localReport,
      summary: localReport.executiveSummary,
      chatMessages
    };

    registerCompletedMeeting(completed);
    return completed;
  };

  return (
    <MeetingContext.Provider
      value={{
        meetings,
        activeMeeting,
        setActiveMeeting,
        actions,
        setActions,
        transcriptTurns,
        setTranscriptTurns,
        chatMessages,
        setChatMessages,
        sendChatMessage,
        endMeetingAndGenerateReport,
        activeSpeakerId,
        socketStatus,
        isLiveActive,
        liveCommitments,
        evidenceModalOpen,
        selectedEvidence,
        openEvidence,
        closeEvidence,
        ragDrawerOpen,
        selectedContradiction,
        openContradiction,
        closeContradiction,
        createMeeting,
        joinMeetingByCode,
        registerCompletedMeeting,
        updateActionStatus,
        loadDemoMeeting,
        clearAllMeetings,
        startLiveSimulation,
        stopLiveSimulation
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeeting = () => {
  const context = useContext(MeetingContext);
  if (!context) throw new Error('useMeeting must be used within MeetingProvider');
  return context;
};
