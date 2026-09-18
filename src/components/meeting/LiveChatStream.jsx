import React, { useState, useRef, useEffect } from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Send,
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LiveChatStream = ({
  messages = [],
  onSendMessage,
  meetingCode = '',
  meetingTitle = '',
  onViewEvidence = null,
  className = ''
}) => {
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (onSendMessage) {
      onSendMessage(inputText.trim(), user);
    }
    setInputText('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyCode = () => {
    if (meetingCode) {
      navigator.clipboard.writeText(meetingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const quickPrompts = [
    { label: "We need the payment API", text: "We need the payment API refactor and idempotency fixes." },
    { label: "I'll complete it by Friday", text: "I'll complete the payment API refactor by Friday at 5:00 PM EST." },
    { label: "@ai summarize commitments", text: "@ai summarize current commitments and deadlines." },
    { label: "Standardize on Aurora PG", text: "Agreed decision: We will standardize on Aurora PostgreSQL." }
  ];

  return (
    <div className={`flex flex-col h-full rounded-2xl glass-panel border border-white/10 overflow-hidden shadow-2xl ${className}`}>
      {/* Top Header: Synced Meeting ID Verification Bar */}
      <div className="p-3.5 px-4 border-b border-white/8 bg-surface-elevated/60 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-soft">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Live Chat Session
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                ({messages.length} messages)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Meeting ID:</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="font-mono text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 transition-colors"
                title="Click to copy Meeting ID"
              >
                <span>{meetingCode || 'G13-SYNC'}</span>
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-emerald-400/70" />}
              </button>
            </div>
          </div>
        </div>

        {/* Verification Pill */}
        <div className="flex items-center gap-2">
          <Badge variant="emerald" dot size="sm">
            Live Chat Synchronized
          </Badge>
          <span className="hidden sm:inline text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
            Same ID Enforced
          </span>
        </div>
      </div>

      {/* Message Stream Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth min-h-[380px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Live Chat Room Active
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Both User 1 and User 2 can now chat simultaneously. The <strong>G13 AI Copilot</strong> will automatically track commitments, deadlines, and decisions in real time.
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-primary-soft bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                Share Meeting ID: {meetingCode} with User 2 to begin
              </span>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isBot = !!(msg.sender?.isBot ?? msg.is_bot);
            const senderId = msg.sender?.id || msg.sender_id;
            const senderName = (msg.sender?.name || msg.sender_name || '').trim();
            const currentUserId = user?.id || (typeof window !== 'undefined' ? localStorage.getItem('g13_guest_id') : null);
            const currentUserName = user?.name?.trim().toLowerCase();

            const isCurrentUser = !isBot && Boolean(
              (currentUserId && senderId && senderId === currentUserId) ||
              (currentUserName && senderName && senderName.toLowerCase() === currentUserName)
            );
            const hasCommitment = !!msg.commitmentDetails;

            if (isBot) {
              return (
                <div
                  key={msg.id || idx}
                  className="p-3.5 rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-950/25 to-surface-elevated/50 shadow-glow-sm space-y-2 animate-fade-in"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-purple-300 font-mono">
                        {msg.sender?.name || 'G13 AI Copilot'}
                      </span>
                      <Badge variant="indigo" size="xs">
                        AI BOT
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {msg.timestamp || 'Just now'}
                    </span>
                  </div>

                  <p className="text-xs text-purple-100/90 leading-relaxed pl-7">
                    {msg.text}
                  </p>
                </div>
              );
            }

            return (
              <div
                key={msg.id || idx}
                className={`flex flex-col animate-fade-in ${
                  isCurrentUser ? 'items-end' : 'items-start'
                }`}
              >
                {/* Sender Tag */}
                <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">
                    {senderName || (isCurrentUser ? 'You' : 'Attendee')}
                  </span>
                  {isCurrentUser ? (
                    <span className="text-[9px] font-mono px-1 rounded bg-primary/20 text-primary-soft font-bold">
                      YOU
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-1 rounded bg-white/10 text-slate-300">
                      {msg.sender?.role || 'Attendee'}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">
                    • {msg.timestamp || 'Just now'}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl border text-xs leading-relaxed transition-all ${
                    isCurrentUser
                      ? 'bg-gradient-to-br from-primary/30 to-primary/15 border-primary/40 text-white rounded-tr-sm shadow-md'
                      : 'bg-surface-elevated border-white/10 text-slate-200 rounded-tl-sm shadow-md'
                  }`}
                >
                  <p className="break-words">{msg.text}</p>

                  {/* Commitment Badge if detected */}
                  {hasCommitment && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-mono text-[10px] font-bold">
                          Commitment: {msg.commitmentDetails.action}
                        </span>
                      </div>
                      <Badge variant="emerald" size="xs">
                        Due: {msg.commitmentDetails.deadline}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/20 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-mono text-slate-500 shrink-0">Quick:</span>
        {quickPrompts.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setInputText(q.text)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-elevated/70 hover:bg-surface-highlight border border-white/8 text-slate-300 hover:text-white whitespace-nowrap transition-colors"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-white/8 bg-surface-elevated/80 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message room (${meetingCode || 'Live Sync'}) or ask @ai...`}
            className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono hidden sm:inline">
            Enter ↵
          </span>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          icon={Send}
          disabled={!inputText.trim()}
          className="shadow-glow-sm shrink-0"
        >
          Send
        </Button>
      </form>
    </div>
  );
};

export default LiveChatStream;
