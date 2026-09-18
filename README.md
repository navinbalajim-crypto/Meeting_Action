# G13 — AI Meeting-to-Action Intelligence Agent

> Transform conversations into verified decisions, commitments, action items, owners, deadlines, and evidence-grounded organizational knowledge.

## 🚀 Overview

G13 is an AI-powered meeting intelligence system that processes live meetings, existing audio/transcripts, and manual conversations to understand what was actually discussed and convert it into structured, actionable knowledge.

Instead of simply generating a meeting summary, G13 identifies:

- What was decided
- What was committed
- Who is responsible
- When it is due
- Why the action was extracted
- Evidence from the original conversation

## 🎯 Problem

Long meetings contain important decisions, commitments, requirements, and deadlines that are easily missed or forgotten.

Traditional meeting transcription and summarization tools mainly answer:

> "What was discussed?"

G13 focuses on:

> **"What was committed, who owns it, when is it due, and what evidence supports it?"**

## 💡 Key Features

### Meeting Intelligence
- Meeting creation
- Unique meeting codes
- Live meeting support
- Existing audio/transcript processing
- Manual conversation mode
- Automatic meeting report generation

### AI Extraction
- Meeting summarization
- Topic extraction
- Decision extraction
- Action-item extraction
- Commitment detection
- Owner identification
- Deadline extraction
- Customer requirement extraction
- Customer concern detection
- Dependency detection
- Contradiction detection
- Unresolved issue detection

### Commitment Intelligence

G13 distinguishes between different conversation types:

- Explicit Commitment
- Decision
- Proposed Action
- Discussion
- Question
- Information

Example:

> "I'll complete the API by Friday."

→ Explicit Commitment

> "Maybe we should improve the dashboard."

→ Discussion / Suggestion

### 🎙️ Speaker Intelligence

- Speech-to-text
- Speaker diarization
- Speaker identification
- Voice profile enrollment
- Voice embedding generation
- Voice matching
- Speaker-aware transcript

### 🔊 Audio & Acoustic Analysis

- Voice Activity Detection
- Active speech duration
- Silence / pause duration
- Speech ratio
- RMS loudness
- Peak amplitude
- Mean vocal pitch
- Sampling frequency
- Frequency spectrum
- Spectral centroid

### 🧠 AI Intelligence

- Whisper / WhisperX
- Speaker Diarization
- ECAPA-TDNN
- Groq LLM
- RAG / Vector Search
- Evidence Grounding
- Context Preservation
- Confidence Scoring
- Sentiment Analysis
- Speech Emotion Analysis

## 🔍 Evidence Grounding

Every important extracted item can be linked back to its source conversation.

Example:

**Action:** Complete API integration  
**Owner:** Arun  
**Deadline:** Friday  
**Evidence:** "I'll complete the API integration by Friday."  
**Speaker:** Arun  
**Timestamp:** 18:42

This helps users verify AI-generated information against the original conversation.

## 📊 Final Meeting Report

G13 generates a structured report containing:

- Meeting Overview
- Executive Summary
- Major Topics
- Decisions
- Commitments
- Action Items
- Owners
- Deadlines
- Customer Requirements
- Customer Concerns
- Dependencies
- Unresolved Issues
- Contradictions / Changes
- Sentiment
- Speaker Analysis
- Confidence
- Evidence
- Full Transcript
- Follow-up Tracker

## 🏗️ System Architecture

```text
                 ┌─────────────────────┐
                 │   React Frontend    │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Node.js + Express   │
                 │      Backend        │
                 └──────────┬──────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       ┌───────────┐  ┌───────────┐  ┌─────────────┐
       │ PostgreSQL│  │  Storage  │  │ Socket.IO   │
       │ Supabase  │  │ Supabase  │  │ Real-time   │
       └───────────┘  └───────────┘  └─────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  AI Intelligence    │
                 │      Engine         │
                 └──────────┬──────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   ┌─────────┐       ┌────────────┐       ┌──────────┐
   │ Whisper │       │ Diarization│       │ Groq LLM │
   └─────────┘       └────────────┘       └──────────┘
        │                   │                   │
        ▼                   ▼                   ▼
   Transcript          Speakers          Intelligence
