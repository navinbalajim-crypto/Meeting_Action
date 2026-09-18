-- ===================================================================
-- G13 AI Meeting-to-Action Intelligence Platform
-- PostgreSQL / Supabase Schema Definition (001_initial_schema.sql)
-- ===================================================================

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  organization VARCHAR(255) DEFAULT 'General',
  avatar VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. REFRESH TOKENS (Hashed & Revocable)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- 3. MEETINGS
CREATE TABLE IF NOT EXISTS meetings (
  id VARCHAR(64) PRIMARY KEY,
  meeting_code VARCHAR(32) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  owner_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  organization VARCHAR(255),
  meeting_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  is_demo BOOLEAN DEFAULT FALSE,
  duration VARCHAR(50),
  raw_duration_sec FLOAT DEFAULT 0,
  summary TEXT,
  report_data JSONB,
  audio_metrics JSONB,
  audio_url VARCHAR(512),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_owner_id ON meetings(owner_id);
CREATE INDEX IF NOT EXISTS idx_meetings_code ON meetings(meeting_code);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at DESC);

-- 4. MEETING PARTICIPANTS
CREATE TABLE IF NOT EXISTS meeting_participants (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  is_user BOOLEAN DEFAULT FALSE,
  avatar VARCHAR(50),
  color VARCHAR(50),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_participants_user ON meeting_participants(user_id);

-- 5. AUDIO FILES
CREATE TABLE IF NOT EXISTS audio_files (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) REFERENCES meetings(id) ON DELETE CASCADE,
  uploaded_by VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(255) NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  mime_type VARCHAR(100),
  file_size BIGINT,
  duration_sec FLOAT,
  audio_metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audio_files_meeting ON audio_files(meeting_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_uploaded_by ON audio_files(uploaded_by);

-- 6. PROCESSING JOBS
CREATE TABLE IF NOT EXISTS processing_jobs (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64),
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  audio_file_path VARCHAR(512) NOT NULL,
  status VARCHAR(50) DEFAULT 'PROCESSING',
  current_stage_index INT DEFAULT 0,
  current_stage_key VARCHAR(100),
  current_stage_label VARCHAR(255),
  completed_stages JSONB DEFAULT '[]'::jsonb,
  vad_result JSONB,
  report JSONB,
  transcript JSONB,
  speakers JSONB,
  error JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_processing_jobs_user ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_meeting ON processing_jobs(meeting_id);

-- 7. TRANSCRIPT SEGMENTS
CREATE TABLE IF NOT EXISTS transcript_segments (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  segment_index INT,
  speaker_id VARCHAR(64),
  speaker_name VARCHAR(255),
  is_user_match BOOLEAN DEFAULT FALSE,
  start_sec FLOAT,
  end_sec FLOAT,
  timestamp_label VARCHAR(50),
  text TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcript_segments_meeting ON transcript_segments(meeting_id);

-- 8. SPEAKERS
CREATE TABLE IF NOT EXISTS speakers (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  speaker_label VARCHAR(100) NOT NULL,
  display_name VARCHAR(255),
  role VARCHAR(100),
  voice_match_score VARCHAR(100),
  is_user_match BOOLEAN DEFAULT FALSE,
  total_duration_sec FLOAT DEFAULT 0,
  turn_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_speakers_meeting ON speakers(meeting_id);

-- 9. VOICE PROFILES & SAMPLES (Raw vectors never exposed via API)
CREATE TABLE IF NOT EXISTS voice_profiles (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  sample_count INT DEFAULT 0,
  sample_rate VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voice_embeddings (
  id VARCHAR(64) PRIMARY KEY,
  voice_profile_id VARCHAR(64) NOT NULL REFERENCES voice_profiles(id) ON DELETE CASCADE,
  sample_type VARCHAR(100),
  embedding_reference VARCHAR(255),
  embedding_vector JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ACTION ITEMS & ACCOUNTABILITY
CREATE TABLE IF NOT EXISTS action_items (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) REFERENCES meetings(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  owner VARCHAR(255) NOT NULL,
  deadline VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Committed',
  confidence VARCHAR(50) DEFAULT 'High',
  speaker VARCHAR(255),
  timestamp_label VARCHAR(50),
  evidence_quote TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_action_items_meeting ON action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_action_items_owner ON action_items(owner);
CREATE INDEX IF NOT EXISTS idx_action_items_deadline ON action_items(deadline);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status);

-- 11. DECISIONS
CREATE TABLE IF NOT EXISTS decisions (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  decision_text TEXT NOT NULL,
  context TEXT,
  speaker VARCHAR(255),
  timestamp_label VARCHAR(50),
  evidence TEXT,
  confidence VARCHAR(50) DEFAULT 'High',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_decisions_meeting ON decisions(meeting_id);

-- 12. EVIDENCE
CREATE TABLE IF NOT EXISTS evidence (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'action_item' | 'decision' | 'requirement'
  entity_id VARCHAR(64) NOT NULL,
  transcript_segment_id VARCHAR(64),
  quote TEXT NOT NULL,
  speaker VARCHAR(255),
  start_time VARCHAR(50),
  end_time VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_meeting ON evidence(meeting_id);

-- 13. CONTRADICTIONS & CROSS-MEETING REVISIONS
CREATE TABLE IF NOT EXISTS contradictions (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  topic VARCHAR(255) NOT NULL,
  old_statement TEXT,
  new_statement TEXT,
  difference_summary TEXT,
  badge VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CUSTOMER REQUIREMENTS & CONCERNS
CREATE TABLE IF NOT EXISTS customer_requirements (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  source_speaker VARCHAR(255),
  timestamp_label VARCHAR(50),
  evidence TEXT,
  priority VARCHAR(50) DEFAULT 'High',
  confidence VARCHAR(50) DEFAULT 'High',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_concerns (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  concern TEXT NOT NULL,
  source_speaker VARCHAR(255),
  timestamp_label VARCHAR(50),
  evidence TEXT,
  urgency VARCHAR(50) DEFAULT 'Medium',
  confidence VARCHAR(50) DEFAULT 'High',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. LIVE CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(64) PRIMARY KEY,
  meeting_id VARCHAR(64) NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  meeting_code VARCHAR(32) NOT NULL,
  sender_id VARCHAR(64),
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(100),
  is_user BOOLEAN DEFAULT FALSE,
  is_bot BOOLEAN DEFAULT FALSE,
  text TEXT NOT NULL,
  timestamp_label VARCHAR(50),
  commitment_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_meeting ON chat_messages(meeting_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_code ON chat_messages(meeting_code);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at ASC);

