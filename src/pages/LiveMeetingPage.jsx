import React, { useState, useEffect } from 'react';
import { ParticipantList } from '../components/meeting/ParticipantList';
import { LiveChatStream } from '../components/meeting/LiveChatStream';
import { CommitmentCard } from '../components/intelligence/CommitmentCard';
import { HistoricalContextCard } from '../components/intelligence/HistoricalContextCard';
import { MeetingControls } from '../components/meeting/MeetingControls';
import { Badge } from '../components/common/Badge';
import { useMeeting } from '../context/MeetingContext';
import { useToast } from '../context/ToastContext';
import { ragService } from '../services/ragService';
import { meetingService } from '../services/meetingService';
import { Sparkles, MessageSquare, ShieldCheck, Database, Zap, Quote, AlertTriangle, LogIn, ArrowRight, Loader2 } from 'lucide-react';

export const LiveMeetingPage = ({ onNavigate }) => {
  const {
    activeMeeting,
    transcriptTurns,
    chatMessages,
    setChatMessages,
    sendChatMessage,
    joinMeetingByCode,
    endMeetingAndGenerateReport,
    activeSpeakerId,
    socketStatus,
    liveCommitments,
    openEvidence,
    openContradiction
  } = useMeeting();

  const { addToast } = useToast();
  const [historicalMatches, setHistoricalMatches] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [switchCode, setSwitchCode] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);

  // Background polling for flawless chat sync across multiple windows/users
  useEffect(() => {
    if (!activeMeeting?.code) return;
    const cleanCode = activeMeeting.code.trim().toUpperCase();

    const interval = setInterval(async () => {
      try {
        const msgs = await meetingService.getChatMessages(cleanCode);
        if (Array.isArray(msgs) && msgs.length > 0) {
          setChatMessages((prev) => {
            const map = new Map();
            for (const m of prev) map.set(m.id, m);
            for (const m of msgs) map.set(m.id, m);
            return Array.from(map.values()).sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
          });
        }
      } catch (e) {
        // ignore background poll network hiccups
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [activeMeeting?.code, setChatMessages]);

  const handleSwitchRoom = async (e) => {
    if (e) e.preventDefault();
    const clean = switchCode.trim().toUpperCase();
    if (!clean) return;

    setIsSwitching(true);
    try {
      const res = await joinMeetingByCode(clean);
      if (res.success) {
        addToast({
          title: 'Joined Live Room',
          message: `Now connected to ${clean}. Chat history synchronized.`,
          type: 'success'
        });
        setSwitchCode('');
      } else {
        addToast({
          title: 'Meeting Not Found',
          message: res.error || 'Check meeting code.',
          type: 'error'
        });
      }
    } catch (err) {
      addToast({
        title: 'Join Error',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsSwitching(false);
    }
  };

  // Auto-search historical context when terms appear in chat
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      const matches = ragService.searchHistoricalContext(lastMsg.text, activeMeeting?.id);
      if (matches.length > 0) {
        setHistoricalMatches(matches);
      }
    }
  }, [chatMessages.length, activeMeeting?.id]);

  const handleEndMeeting = async () => {
    setIsGeneratingReport(true);
    try {
      addToast({
        title: 'Synthesizing Meeting Intelligence',
        message: 'G13 Intelligence Engine is parsing commitments, owners, and evidence...',
        type: 'info'
      });

      const completed = await endMeetingAndGenerateReport();

      addToast({
        title: 'Final Meeting Report Ready',
        message: 'Intelligence synthesized and synchronized to database.',
        type: 'success'
      });

      onNavigate('report');
    } catch (err) {
      console.error('Failed to generate report:', err);
      addToast({
        title: 'Report Generation Notice',
        message: 'Redirecting to report overview with live conversation state.',
        type: 'warning'
      });
      onNavigate('report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Ensure attendees list includes active attendees + G13 AI Bot
  const rawParticipants = activeMeeting?.participants || [
    { id: 'user-1', name: 'Alex Rivera', role: 'Host', isUser: true, avatar: 'AR', color: '#5B6CFF' }
  ];

  const hasBot = rawParticipants.some(p => p.id === 'bot_g13_ai' || p.isBot);
  const displayParticipants = hasBot
    ? rawParticipants
    : [
        ...rawParticipants,
        {
          id: 'bot_g13_ai',
          name: 'G13 AI Copilot',
          role: 'AI Intelligence Assistant',
          avatar: 'AI',
          color: '#8B5CF6',
          isBot: true
        }
      ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#080B16] text-white p-3 sm:p-6 max-w-[1700px] mx-auto flex flex-col gap-4">
      {/* Session Title Bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/8 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary-soft">
            <MessageSquare className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-display">
                {activeMeeting?.title || "Executive Live Chat Sync"}
              </h2>
              <Badge variant="indigo" size="xs">
                {activeMeeting?.code || "G13-SYNC"}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              {activeMeeting?.client || "Enterprise Client"} • {activeMeeting?.organization || "Core Platform Team"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Room Switcher / Join Code Form */}
          <form onSubmit={handleSwitchRoom} className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 shadow-inner">
            <input
              type="text"
              placeholder="Join room ID (e.g. G13-XXXXX)"
              value={switchCode}
              onChange={(e) => setSwitchCode(e.target.value)}
              className="bg-transparent px-2.5 py-1 text-xs text-white placeholder-slate-500 font-mono tracking-wider uppercase focus:outline-none w-48"
            />
            <button
              type="submit"
              disabled={isSwitching || !switchCode.trim()}
              className="px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-soft text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50"
              title="Join or switch into this live meeting room"
            >
              {isSwitching ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
              <span>Sync Room</span>
            </button>
          </form>

          <Badge variant="emerald" dot size="sm">
            LIVE CHAT SYNC ACTIVE
          </Badge>
          <span className="text-[11px] font-mono text-slate-400">
            Socket: {socketStatus}
          </span>
        </div>
      </div>

      {!activeMeeting && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-200">No active meeting room selected</p>
              <p className="text-xs text-amber-300/80">
                Enter your teammate's meeting code above to join the live room, or use "Create Meeting" to start a new session.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3-COLUMN WORKSPACE (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[580px]">
        {/* Left Column: Attendees & Active Members (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl glass-panel border border-white/8 p-4 overflow-y-auto">
          <ParticipantList
            participants={displayParticipants}
            activeSpeakerId={activeSpeakerId}
          />
        </div>

        {/* Center Column: Live Chat Stream (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[580px]">
          <LiveChatStream
            messages={chatMessages}
            onSendMessage={sendChatMessage}
            meetingCode={activeMeeting?.code}
            meetingTitle={activeMeeting?.title}
            onViewEvidence={openEvidence}
          />
        </div>

        {/* Right Column: AI Intelligence Live Feed (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl glass-panel border border-white/8 p-4 flex flex-col gap-4 overflow-y-auto h-[580px]">
          <div className="flex items-center justify-between pb-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ai animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Live Extracted Commitments
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">
              {liveCommitments.length} Logged
            </span>
          </div>

          {/* RAG Cross-Meeting Contradiction Card if detected */}
          {historicalMatches.length > 0 && (
            <HistoricalContextCard
              item={historicalMatches[0]}
              onOpenMeeting={() => onNavigate('history')}
            />
          )}

          {/* List of Detected Commitments & Actions */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {liveCommitments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <Zap className="w-8 h-8 mb-2 text-slate-600" />
                <p className="text-xs font-medium text-slate-300">
                  Awaiting explicit commitments in chat...
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  The G13 AI Engine automatically detects promises, owners, and deadlines as User 1 and User 2 type messages.
                </p>
              </div>
            ) : (
              liveCommitments.map((item, idx) => (
                <CommitmentCard
                  key={item.id || idx}
                  item={{
                    ...item,
                    category: item.category || 'Live Chat Sync',
                    owner: item.owner || 'Attendee',
                    deadline: item.deadline || 'Pending Review',
                    confidence: item.confidence || 'High (98%)'
                  }}
                  onViewEvidence={openEvidence}
                  onViewContradiction={openContradiction}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Meeting Control Bar */}
      <MeetingControls
        onEndMeeting={handleEndMeeting}
        socketStatus={socketStatus}
        messageCount={chatMessages.length}
        isGeneratingReport={isGeneratingReport}
      />
    </div>
  );
};

export default LiveMeetingPage;
