import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { FileText, Sparkles, MessageSquare, Users, ShieldCheck, Loader2 } from 'lucide-react';

export const MeetingControls = ({
  onEndMeeting,
  socketStatus = 'Ready',
  messageCount = 0,
  isGeneratingReport = false
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 rounded-2xl glass-panel-elevated border border-white/10 flex items-center justify-between gap-4 flex-wrap shadow-2xl">
      {/* Left: Live Session Status & Timer */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-white font-bold tracking-wider">
            LIVE CHAT
          </span>
          <span className="text-xs font-mono text-emerald-400 font-medium">
            {formatTimer(seconds)}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pl-4 border-l border-white/10">
          <MessageSquare className="w-3.5 h-3.5 text-primary-soft" />
          <span className="font-mono text-[11px]">{messageCount} Live Messages</span>
        </div>
      </div>

      {/* Center: AI Copilot Status */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
        <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
        <span className="text-[11px]">G13 AI Copilot Active • Listening for Commitments</span>
      </div>

      {/* Right: End & Generate Report */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          icon={isGeneratingReport ? Loader2 : FileText}
          onClick={onEndMeeting}
          disabled={isGeneratingReport}
          className="shadow-glow-md"
        >
          {isGeneratingReport ? 'Synthesizing Report...' : 'End & Generate Final Report'}
        </Button>
      </div>
    </div>
  );
};

export default MeetingControls;
