// Realistic transcripts with speaker attribution, timestamps, and evidence markers
export const LIVE_DEMO_TRANSCRIPT = [
  {
    id: "turn-1",
    timestamp: "00:15",
    speakerId: "user-1",
    speakerName: "Alex Rivera",
    speakerRole: "Host & Engineering Lead",
    isUser: true,
    text: "Thanks everyone for joining. Today we need to lock down the Q3 Stripe Billing integration and solve the webhook latency spikes we noticed on staging.",
    type: "discussion"
  },
  {
    id: "turn-2",
    timestamp: "00:42",
    speakerId: "cust-1",
    speakerName: "Sarah Chen",
    speakerRole: "VP of Product, FinEdge (Customer)",
    isUser: false,
    text: "Thanks Alex. From our side, our enterprise pilot starts October 1st. If the payment API isn't reliable and compliant by next week, we risk delaying 4 major pilot accounts.",
    type: "requirement"
  },
  {
    id: "turn-3",
    timestamp: "01:20",
    speakerId: "user-2",
    speakerName: "Raj Patel",
    speakerRole: "Senior Backend Architect",
    isUser: false,
    text: "I looked at the webhook failure logs this morning. It's an idempotent lock contention on PostgreSQL connection pooling under concurrent retry bursts.",
    type: "information"
  },
  {
    id: "turn-4",
    timestamp: "02:05",
    speakerId: "user-1",
    speakerName: "Alex Rivera",
    speakerRole: "Host & Engineering Lead",
    isUser: true,
    text: "Raj, can you commit to refactoring the Redis distributed lock and verifying end-to-end sandbox payments before the Friday code freeze?",
    type: "question"
  },
  {
    id: "turn-5",
    timestamp: "02:28",
    speakerId: "user-2",
    speakerName: "Raj Patel",
    speakerRole: "Senior Backend Architect",
    isUser: false,
    text: "Yes, I will complete the payment API refactor and push the idempotency fixes to staging by Friday at 5 PM EST.",
    type: "commitment",
    commitmentDetails: {
      action: "Complete Payment API Refactor & Idempotency Fixes",
      owner: "Raj Patel",
      deadline: "Friday at 5 PM EST",
      confidence: "High",
      type: "COMMITMENT",
      category: "Engineering"
    }
  },
  {
    id: "turn-6",
    timestamp: "03:10",
    speakerId: "cust-1",
    speakerName: "Sarah Chen",
    speakerRole: "VP of Product, FinEdge (Customer)",
    isUser: false,
    text: "That sounds great. What about the SOC2 compliance export documentation our compliance team requested?",
    type: "question"
  },
  {
    id: "turn-7",
    timestamp: "03:45",
    speakerId: "user-3",
    speakerName: "Elena Rostova",
    speakerRole: "Security & Compliance Lead",
    isUser: false,
    text: "I have the audit logs parsed. I'll finalize and email the signed SOC2 Type II audit package directly to Sarah by tomorrow afternoon.",
    type: "commitment",
    commitmentDetails: {
      action: "Finalize & Send SOC2 Type II Audit Package",
      owner: "Elena Rostova",
      deadline: "Tomorrow afternoon",
      confidence: "High",
      type: "COMMITMENT",
      category: "Compliance"
    }
  },
  {
    id: "turn-8",
    timestamp: "04:30",
    speakerId: "user-1",
    speakerName: "Alex Rivera",
    speakerRole: "Host & Engineering Lead",
    isUser: true,
    text: "Decision agreed: we will use PostgreSQL 16 read replicas with Supabase connection pooler to eliminate webhook connection exhaustion.",
    type: "decision",
    decisionDetails: {
      decision: "Adopt PostgreSQL 16 Read Replicas with Connection Pooler",
      context: "Eliminates webhook connection starvation during concurrent retry bursts",
      category: "Architecture"
    }
  },
  {
    id: "turn-9",
    timestamp: "05:15",
    speakerId: "cust-2",
    speakerName: "Marcus Vance",
    speakerRole: "Customer CTO",
    isUser: false,
    text: "Wait, on last week's sync on September 12, Raj had initially mentioned delivery for Friday, but if there's any regression testing needed, could Monday work?",
    type: "rag_trigger"
  },
  {
    id: "turn-10",
    timestamp: "05:52",
    speakerId: "user-2",
    speakerName: "Raj Patel",
    speakerRole: "Senior Backend Architect",
    isUser: false,
    text: "Actually, to ensure thorough soak testing over the weekend with automated load tests, let's officially adjust delivery: Staging deployment on Friday, production sign-off moved to Monday morning.",
    type: "contradiction",
    contradictionDetails: {
      item: "Production Sign-off & Delivery",
      previousCommitment: {
        meeting: "Sync Meeting — Sept 12",
        date: "Friday, Sept 19",
        evidence: "Raj Patel: 'We will push the full release to production on Friday.'"
      },
      currentCommitment: {
        meeting: "Current Session — Today",
        date: "Monday morning, Sept 22",
        evidence: "Raj Patel: 'Staging deployment on Friday, production sign-off moved to Monday morning.'"
      },
      reason: "Additional soak testing and load simulation over the weekend"
    }
  },
  {
    id: "turn-11",
    timestamp: "06:30",
    speakerId: "user-1",
    speakerName: "Alex Rivera",
    speakerRole: "Host & Engineering Lead",
    isUser: true,
    text: "Agreed. Who is responsible for setting up the Datadog APM dashboard for latency monitoring?",
    type: "question"
  },
  {
    id: "turn-12",
    timestamp: "06:48",
    speakerId: "cust-1",
    speakerName: "Sarah Chen",
    speakerRole: "VP of Product, FinEdge (Customer)",
    isUser: false,
    text: "We definitely need visibility into p99 response times before the pilot starts.",
    type: "unresolved",
    unresolvedDetails: {
      action: "Setup Datadog APM Latency & p99 Dashboard",
      owner: "Needs Clarification",
      deadline: "Not specified",
      status: "Needs Clarification",
      evidence: "Alex: 'Who is responsible for setting up Datadog?' - No owner assigned."
    }
  }
];

