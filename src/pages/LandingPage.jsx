import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  Play,
  CheckCircle2,
  Users,
  Radio,
  PlusCircle,
  Database,
  History,
  AlertTriangle,
  ChevronRight,
  Quote,
  Target,
  Layers,
  Search
} from 'lucide-react';

export const LandingPage = ({ onNavigate, onOpenCreate, onLaunchDemo }) => {
  // Hero dynamic transformation state
  const [heroStep, setHeroStep] = useState('raw'); // 'raw' -> 'processing' -> 'detected'
  const [activeInputMode, setActiveInputMode] = useState('live'); // 'live' | 'existing'

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroStep((prev) => {
        if (prev === 'raw') return 'processing';
        if (prev === 'processing') return 'detected';
        return 'raw';
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#080B16] text-white selection:bg-primary/30 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-primary/15 via-accent/5 to-transparent blur-[140px] pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-ai/10 blur-[130px] pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border-primary/30 text-xs font-mono text-primary-soft shadow-glow-sm animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-ai animate-pulse" />
          <span>G13 Intelligence Agent • Speaker Diarization + RAG Memory</span>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight font-display text-white leading-[1.1]">
            Turn conversations <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-soft via-ai to-accent">
              into action.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Upload a meeting recording and let AI extract the decisions, commitments, action items, speakers and key insights automatically.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Button
            size="lg"
            variant="ai"
            icon={Zap}
            onClick={() => onNavigate('upload')}
            className="w-full sm:w-auto px-8 shadow-glow-ai font-bold"
          >
            Upload Meeting Audio
          </Button>

          <Button
            size="lg"
            variant="secondary"
            icon={Clock}
            onClick={() => onNavigate('history')}
            className="w-full sm:w-auto px-8 text-slate-200"
          >
            View Previous Meetings
          </Button>

          <button
            onClick={onLaunchDemo}
            className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 font-mono flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3 h-3 text-ai" />
            <span>Interactive Demo</span>
          </button>
        </div>

        {/* HERO VISUAL: SIGNATURE DYNAMIC TRANSFORMATION */}
        <div className="pt-10 max-w-3xl mx-auto">
          <div className="p-1 rounded-3xl bg-gradient-to-b from-primary/30 via-white/10 to-transparent shadow-2xl">
            <div className="rounded-[22px] bg-[#0C1021]/90 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 text-left space-y-6">
              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">
                    Live Diarization Stream • Channel #1
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHeroStep('raw')}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                      heroStep === 'raw' ? 'bg-primary/20 text-primary-soft' : 'text-slate-500'
                    }`}
                  >
                    1. Speech
                  </button>
                  <span className="text-slate-600">→</span>
                  <button
                    onClick={() => setHeroStep('processing')}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                      heroStep === 'processing' ? 'bg-ai/20 text-ai' : 'text-slate-500'
                    }`}
                  >
                    2. AI Analysis
                  </button>
                  <span className="text-slate-600">→</span>
                  <button
                    onClick={() => setHeroStep('detected')}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded transition-colors ${
                      heroStep === 'detected' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    3. Commitment
                  </button>
                </div>
              </div>

              {/* Dynamic Step Visualization */}
              {heroStep === 'raw' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Incoming conversational audio captured from microphone:
                  </div>

                  <div className="p-5 rounded-xl bg-surface-elevated/70 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                          RP
                        </div>
                        <span className="text-xs font-bold text-white">Raj Patel</span>
                        <span className="text-[10px] text-slate-400">Senior Backend Architect</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">02:28</span>
                    </div>
                    <p className="text-base text-slate-100 font-medium leading-relaxed pl-2 border-l-2 border-primary">
                      "I'll complete the payment API refactor and push the idempotency fixes to staging by Friday at 5 PM."
                    </p>
                  </div>
                </div>
              )}

              {heroStep === 'processing' && (
                <div className="space-y-4 animate-fade-in py-2">
                  <div className="flex items-center gap-2 text-xs text-ai font-mono">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    NLP Commitment Classification & Evidence Extraction in progress...
                  </div>

                  <div className="p-6 rounded-xl bg-surface-elevated/40 border border-ai/30 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Diarization match:</span>
                      <strong className="text-white">Raj Patel (99.2% voice match)</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Intent classification:</span>
                      <strong className="text-emerald-400">Explicit Commitment (Score: 0.98)</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Temporal deadline parsed:</span>
                      <strong className="text-primary-soft">Friday, 17:00 EST</strong>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-primary via-ai to-accent h-full w-3/4 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {heroStep === 'detected' && (
                <div className="space-y-4 animate-scale-in">
                  <div className="flex items-center justify-between">
                    <Badge variant="emerald" dot size="md">
                      VERIFIED COMMITMENT DETECTED
                    </Badge>
                    <span className="text-xs font-mono text-ai flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> High Confidence (98%)
                    </span>
                  </div>

                  <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/30 to-surface-elevated border-2 border-emerald-500/50 shadow-glow-commitment space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                        Action Item
                      </span>
                      <h4 className="text-lg font-bold text-white mt-0.5">
                        Complete Payment API Refactor & Idempotency Fixes
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-white/8">
                      <div>
                        <span className="text-slate-400">Accountable Owner:</span>
                        <div className="font-bold text-white text-sm">Raj Patel</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Enforced Deadline:</span>
                        <div className="font-bold text-emerald-400 text-sm">Friday at 5:00 PM EST</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-300">
                      <span className="text-slate-500 font-semibold block mb-0.5">Evidence Provenance:</span>
                      <span className="italic">"I'll complete the payment API refactor and push the idempotency fixes to staging by Friday at 5 PM."</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1 — THE PROBLEM */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <span className="text-xs font-mono text-rose-400 uppercase tracking-wider">
            THE SYSTEMIC PROBLEM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Meeting Notes Are Forgotten. <br />
            Commitments Slip Through the Cracks.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Standard AI tools produce long generic summaries that nobody reads. Critical client requirements and team promises vanish into transcript black holes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6 space-y-2 border-rose-500/20 bg-rose-500/[0.02]">
            <span className="text-rose-400 font-mono text-xs font-bold">01. OVERLOAD</span>
            <h4 className="font-bold text-white text-base">Unfiltered 60-Minute Dialog</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Casual chatter, tangential debates, and jokes bury actual deliverables.
            </p>
          </Card>

          <Card className="p-6 space-y-2 border-amber-500/20 bg-amber-500/[0.02]">
            <span className="text-amber-400 font-mono text-xs font-bold">02. AMBIGUITY</span>
            <h4 className="font-bold text-white text-base">Unclear Ownership</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Phrases like "someone should look into this" leave tasks orphaned.
            </p>
          </Card>

          <Card className="p-6 space-y-2 border-indigo-500/20 bg-indigo-500/[0.02]">
            <span className="text-indigo-400 font-mono text-xs font-bold">03. SLIPPAGE</span>
            <h4 className="font-bold text-white text-base">Vague Deadlines</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              "Soon" and "next week" without strict timestamps lead to missed client SLAs.
            </p>
          </Card>

          <Card className="p-6 space-y-2 border-primary/20 bg-primary/[0.02]">
            <span className="text-primary-soft font-mono text-xs font-bold">04. NO PROOF</span>
            <h4 className="font-bold text-white text-base">Hallucinated Summaries</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generic LLMs invent facts without linking back to exact speech timestamps.
            </p>
          </Card>
        </div>
      </section>

      {/* SECTION 2 — THE G13 SOLUTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-mono text-ai uppercase tracking-wider">
            THE G13 ADVANTAGE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            A Purpose-Built Intelligence Pipeline
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Every sentence is evaluated against strict acoustic, semantic, and accountability gates.
          </p>
        </div>

        {/* Pipeline Step Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { step: '01', title: 'Conversation', desc: 'Live or recorded multi-speaker stream' },
            { step: '02', title: 'Diarization', desc: 'Distinguishes User vs Client voices' },
            { step: '03', title: 'Detection', desc: 'Separates promises from casual ideas' },
            { step: '04', title: 'Evidence', desc: 'Binds verbatim quotes and timestamps' },
            { step: '05', title: 'Accountability', desc: 'Automated follow-up task tracker' },
          ].map((item, i) => (
            <div
              key={i}
              className="p-5 rounded-2xl glass-panel-interactive border border-white/8 space-y-2 relative"
            >
              <span className="text-xs font-mono font-bold text-primary-soft">
                {item.step}
              </span>
              <h4 className="font-bold text-white text-base">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — UNIFIED INTAKE */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-mono text-primary-soft uppercase tracking-wider">
            UNIFIED INTAKE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display">
            Two Modes. One Intelligence Engine.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Whether speaking live or uploading audio recordings, all workflows converge into the exact same verified action engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Mode 1: Live */}
          <Card
            hover
            className={`p-6 space-y-4 border ${
              activeInputMode === 'live' ? 'border-primary/50 shadow-glow-md' : 'border-white/10'
            }`}
            onClick={() => onNavigate('live')}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary-soft flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">1. Live Meeting Workspace</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time speech streaming, dynamic speaker soundwaves, instant commitment alerts, and instant report compilation when ending the sync.
            </p>
            <div className="pt-2 flex items-center text-xs font-semibold text-ai gap-1">
              <span>Launch Live Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>

          {/* Mode 2: Existing */}
          <Card
            hover
            className={`p-6 space-y-4 border ${
              activeInputMode === 'existing' ? 'border-primary/50 shadow-glow-md' : 'border-white/10'
            }`}
            onClick={() => onNavigate('upload')}
          >
            <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Existing Meeting Upload</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag-and-drop audio recordings (.mp3, .wav), transcripts (.vtt, .srt), or notes. Watch the living 6-stage AI processing timeline analyze it.
            </p>
            <div className="pt-2 flex items-center text-xs font-semibold text-ai gap-1">
              <span>Upload Meeting File</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </Card>
        </div>
      </section>

      {/* SECTION 4 & 5 — EVIDENCE GROUNDING & CROSS-MEETING RAG */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <Badge variant="emerald" dot>
              EVIDENCE GROUNDING & RAG MEMORY
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display leading-tight">
              Every Commitment Backed by Verbatim Proof.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              G13 never invents tasks or guesses intent. Every extracted action links directly to the exact speaker turn, timestamp, and surrounding conversation context.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Contradiction Detection:</strong> Flags when a deadline slips between past meetings (e.g. Sept 12: Friday $\to$ Today: Monday).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Unresolved Action Flagging:</strong> If an owner or date was never stated, G13 labels it "Needs Clarification" rather than hallucinating.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                icon={Search}
                onClick={onLaunchDemo}
              >
                Inspect Sample Evidence Provenance
              </Button>
            </div>
          </div>

          {/* Graphic: Evidence Modal Preview */}
          <div className="p-6 rounded-2xl bg-surface-elevated/70 border border-emerald-500/30 shadow-glow-commitment space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-white/8 pb-3">
              <span className="font-mono text-emerald-400 font-bold">
                EVIDENCE PROVENANCE INSPECTOR
              </span>
              <span className="font-mono text-slate-400">02:28 • Track 1</span>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/40 text-xs text-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center">
                  RP
                </div>
                <span className="font-bold text-white">Raj Patel:</span>
              </div>
              <p className="text-slate-100 italic pl-1 border-l-2 border-emerald-400">
                "I will complete the payment API refactor and push the idempotency fixes to staging by Friday at 5 PM EST."
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-300 pt-1">
              <div>
                <span className="text-slate-500">Action:</span> Complete Payment API
              </div>
              <div>
                <span className="text-slate-500">Confidence:</span> High (98%)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6 border-t border-white/8">
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-display">
          Turn Every Meeting into Accountable Action.
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-light">
          Say goodbye to forgotten action items and wasted executive hours. Experience G13 intelligence today.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            variant="ai"
            icon={Zap}
            onClick={onOpenCreate}
            className="w-full sm:w-auto px-8"
          >
            Create Your First Meeting
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={onLaunchDemo}
            className="w-full sm:w-auto px-8"
          >
            Launch 1-Click Guided Demo
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
