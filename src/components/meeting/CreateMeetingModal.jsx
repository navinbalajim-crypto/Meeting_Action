import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Copy,
  Check,
  Share2,
  Users,
  Calendar,
  Clock,
  Video,
  Sparkles,
  ArrowRight,
  Smartphone,
  Wifi,
  Laptop
} from 'lucide-react';
import { useMeeting } from '../../context/MeetingContext';
import { meetingService } from '../../services/meetingService';

export const CreateMeetingModal = ({ isOpen, onClose, onCreated }) => {
  const { createMeeting } = useMeeting();
  const [step, setStep] = useState('form'); // form | created
  const [createdData, setCreatedData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPhoneLink, setCopiedPhoneLink] = useState(false);
  const [networkIp, setNetworkIp] = useState('10.137.242.141');

  const [formData, setFormData] = useState({
    title: '',
    client: '',
    organization: 'Core Platform & Architecture',
    meetingType: 'Client Architecture Review',
    description: '',
    participantsList: 'sarah.chen@finedge.com, raj.patel@company.com'
  });

  useEffect(() => {
    meetingService.getNetworkInfo().then((info) => {
      if (info && info.localIp) {
        setNetworkIp(info.localIp);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newMeet = await createMeeting({
      title: formData.title || 'Executive Architecture & Client Sync',
      client: formData.client || 'Enterprise Client',
      organization: formData.organization,
      type: formData.meetingType,
      description: formData.description
    });
    setCreatedData(newMeet);
    setStep('created');
  };

  const handleCopyCode = () => {
    if (createdData?.code) {
      navigator.clipboard.writeText(createdData.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getPhoneJoinUrl = () => {
    if (!createdData?.code) return '';
    const base = (networkIp && networkIp !== 'localhost')
      ? `http://${networkIp}:3000`
      : (window.location.hostname !== 'localhost' ? window.location.origin : 'http://10.137.242.141:3000');
    return `${base}/#join=${createdData.code}&title=${encodeURIComponent(createdData.title || '')}&client=${encodeURIComponent(createdData.client || '')}`;
  };

  const handleCopyLink = () => {
    if (createdData?.code) {
      const link = `${window.location.origin}/#join=${createdData.code}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyPhoneLink = () => {
    const phoneLink = getPhoneJoinUrl();
    if (phoneLink) {
      navigator.clipboard.writeText(phoneLink);
      setCopiedPhoneLink(true);
      setTimeout(() => setCopiedPhoneLink(false), 2000);
    }
  };

  const handleEnterMeeting = () => {
    onClose();
    if (onCreated) {
      onCreated(createdData);
    }
  };

  const resetAndClose = () => {
    setStep('form');
    setCreatedData(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      maxWidth="max-w-xl"
      title={step === 'form' ? "Schedule New AI-Assisted Meeting" : "Meeting Created Successfully"}
      subtitle={step === 'form' ? "Initialize real-time speaker diarization and commitment extraction" : "Share access credentials with attendees"}
    >
      {step === 'form' ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Meeting Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Billing API Latency & SLA Sync"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B16] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Customer / Client
              </label>
              <input
                type="text"
                placeholder="e.g. FinEdge Technologies"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B16] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Organization / Team
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B16] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Meeting Type
              </label>
              <select
                value={formData.meetingType}
                onChange={(e) => setFormData({ ...formData, meetingType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B16] border border-white/10 text-white focus:outline-none focus:border-primary text-sm"
              >
                <option value="Client Architecture Review">Client Architecture Review</option>
                <option value="Sprint Planning & Commitments">Sprint Planning & Commitments</option>
                <option value="Security & Compliance Audit">Security & Compliance Audit</option>
                <option value="Executive Sync">Executive Sync</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Participants (Emails)
              </label>
              <input
                type="text"
                placeholder="Comma separated emails"
                value={formData.participantsList}
                onChange={(e) => setFormData({ ...formData, participantsList: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B16] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Agenda & Context
            </label>
            <textarea
              rows={2}
              placeholder="Key objectives, known blockers, or prior commitments to verify..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-[#080B16] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/8">
            <Button variant="ghost" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit" variant="ai" icon={Sparkles}>
              Generate Meeting Room
            </Button>
          </div>
        </form>
      ) : (
        /* Created State / Share Panel */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#080B16]/90 border border-primary/30 text-center space-y-3">
            <span className="text-xs text-ai uppercase font-mono tracking-widest">
              UNIQUE MEETING ACCESS CODE
            </span>
            <div className="text-3xl font-extrabold text-white tracking-widest font-mono select-all text-transparent bg-clip-text bg-gradient-to-r from-primary-soft to-ai">
              {createdData?.code || 'G13-X7K92'}
            </div>
            <p className="text-xs text-slate-400">
              {createdData?.title} • {createdData?.client}
            </p>
          </div>

          {/* Copy Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={handleCopyCode}
              className="p-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-ai" />}
              <span>{copiedCode ? "Code Copied!" : "Copy Code"}</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-3 rounded-xl bg-surface-elevated hover:bg-surface-highlight border border-white/10 flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Laptop className="w-4 h-4 text-primary-soft" />}
              <span>{copiedLink ? "Link Copied!" : "Copy PC Link"}</span>
            </button>

            <button
              onClick={handleCopyPhoneLink}
              className="p-3 rounded-xl bg-primary/20 hover:bg-primary/30 border border-primary/40 flex items-center justify-center gap-2 text-xs font-semibold text-white transition-colors shadow-glow-sm"
            >
              {copiedPhoneLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Smartphone className="w-4 h-4 text-ai" />}
              <span>{copiedPhoneLink ? "Phone Link Copied!" : "Copy Phone Link"}</span>
            </button>
          </div>

          {/* Dedicated Mobile Joining Guide Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-ai/10 via-surface-elevated to-primary/10 border border-ai/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-white">
              <Wifi className="w-4 h-4 text-ai" />
              <span>Joining from your Phone (on same Wi-Fi network):</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Open this URL on your phone browser:
            </p>
            <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 font-mono text-[11px] text-ai select-all break-all">
              {getPhoneJoinUrl()}
            </div>
            <p className="text-[10px] text-slate-400">
              Or simply open <span className="text-white font-mono">http://{networkIp}:3000</span> on your phone and enter code <span className="text-emerald-400 font-mono font-bold">{createdData?.code}</span>.
            </p>
          </div>

          {/* Waiting Room Status */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ai animate-pulse" />
              <span>Waiting for participants to connect...</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">Cross-Device Ready</span>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              className="w-full py-3 text-sm shadow-glow-sm"
              icon={ArrowRight}
              onClick={handleEnterMeeting}
            >
              Enter Live Meeting Workspace
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CreateMeetingModal;
