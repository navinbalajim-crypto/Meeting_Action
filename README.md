# G13 — BACKEND + AUTHENTICATION + DATABASE INTEGRATION PROMPT

<role>
You are a senior backend architect and security-focused API engineer.

Your task is to build and productionize ONLY the backend,
authentication, database/persistence, and API integration layer
for my existing G13 AI Meeting-to-Action Intelligence Platform.

Do NOT modify the frontend UI/design unless absolutely required
for API compatibility.

Do NOT rebuild already completed frontend functionality.

First inspect the existing repository and understand what is already implemented.
Preserve all working functionality.
</role>


# 1. EXISTING PROJECT

Project:

G13 — AI Meeting-to-Action Intelligence Platform

The existing frontend already contains:

- Authentication pages
- AuthContext
- API service
- Meeting service
- Audio upload service
- Intelligence service
- Socket service
- Voice profile service
- RAG service
- Meeting history
- Action tracker
- Live meeting
- Existing meeting upload
- Reports

The frontend API client already supports bearer-token handling and
uses the environment variable:

VITE_API_URL

The frontend authentication state currently uses:

g13_auth_token

The frontend also contains login/register/session handling and
a demo workspace mode.

Do not break these existing contracts.


# 2. CURRENT BACKEND

The existing backend is Node.js + Express.

Current backend responsibilities include:

- Express server
- Socket.IO
- Multer audio upload
- CORS
- Static upload serving
- Meeting persistence
- REST APIs
- Processing job management

Existing persistence currently includes:

uploads/
├── audio/
├── jobs/
└── meetings.json

The backend already has:

server.js

and service modules under:

server/services/

Preserve the existing architecture where practical.

Do not replace the backend with Python/FastAPI.

The current backend should remain:

Node.js
+
Express 5
+
Socket.IO


# 3. PRIMARY GOAL

Create a proper backend foundation for:

1. Authentication
2. User accounts
3. Authorization
4. Meeting ownership
5. Participants
6. Audio ownership
7. Processing jobs
8. Transcripts
9. Meeting intelligence
10. Action items
11. Evidence
12. Meeting history
13. Voice profiles
14. Follow-up tracking
15. Cross-meeting data
16. Secure persistence


# 4. AUTHENTICATION ARCHITECTURE

Implement secure authentication.

Required operations:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/refresh

Authentication must use secure token-based authentication.

Recommended:

JWT access token
+
refresh token

Never store passwords as plaintext.

Use:

bcrypt or bcryptjs

for password hashing.

Never store:

password
plain_password
raw credentials

in the database.


# 5. USER MODEL

Create a User entity containing at minimum:

id
name
email
password_hash
role
created_at
updated_at
last_login_at
is_active

Optional:

avatar
organization_id
preferences


# 6. USER ROLES

Support:

user
admin

Keep the authorization architecture extensible for future roles such as:

owner
manager
analyst

Do not allow users to access another user's private meetings.


# 7. AUTHENTICATION FLOW

Registration:

Client
↓
POST /api/auth/register
↓
Validate input
↓
Check duplicate email
↓
Hash password
↓
Create user
↓
Generate authentication tokens
↓
Return safe user information


Login:

Client
↓
POST /api/auth/login
↓
Validate credentials
↓
Compare password hash
↓
Generate access token
↓
Generate refresh token
↓
Return authenticated session


Authenticated request:

Frontend
↓
Authorization: Bearer <token>
↓
Authentication middleware
↓
Validate token
↓
Attach authenticated user to req.user
↓
Route authorization
↓
Controller


# 8. AUTH MIDDLEWARE

Create middleware such as:

server/middleware/authMiddleware.js

Responsibilities:

- Read Authorization header
- Validate Bearer token
- Verify JWT
- Extract user ID
- Load user where required
- Attach user to request
- Reject invalid/expired tokens

Example:

Authorization: Bearer eyJ...


Return:

401 Unauthorized

when authentication fails.


# 9. AUTHORIZATION

Authentication answers:

"Who is this user?"

Authorization answers:

"Is this user allowed to access this resource?"

Every protected meeting endpoint must verify ownership or permission.

Example:

User A must NOT be able to access:

GET /api/meetings/<User-B-meeting>

User A must NOT be able to:

- download User B audio
- read User B transcript
- view User B report
- modify User B actions
- access User B voice profile


# 10. DEMO MODE

The existing frontend has a demo workspace mode.

Do not allow demo mode to bypass real security accidentally.

Create a controlled demo user/session if demo mode is retained.

Clearly separate:

DEMO DATA

from

REAL USER DATA

Never allow demo authentication to expose real user information.


# 11. DATABASE

Replace the current long-term reliance on:

uploads/meetings.json

with a proper database architecture.

The existing JSON persistence may remain as a temporary development fallback,
but production data must be stored in a database.

Preferred:

PostgreSQL

The implementation should be compatible with:

Supabase PostgreSQL

if Supabase is selected for deployment.


# 12. DATABASE TABLES

Create the following logical entities.

## users

id
name
email
password_hash
role
is_active
created_at
updated_at
last_login_at


## refresh_tokens

id
user_id
token_hash
expires_at
revoked_at
created_at


## meetings

id
meeting_code
title
owner_id
client_name
meeting_type
status
started_at
ended_at
created_at
updated_at


## meeting_participants

id
meeting_id
user_id
display_name
role
joined_at
left_at


## audio_files

id
meeting_id
uploaded_by
original_filename
storage_path
mime_type
file_size
duration
created_at


## processing_jobs

id
meeting_id
audio_file_id
status
current_stage
error_code
error_message
created_at
started_at
completed_at


## transcript_segments

id
meeting_id
segment_index
speaker_id
start_time
end_time
text
confidence
created_at


## speakers

id
meeting_id
speaker_label
display_name
role
created_at


## voice_profiles

id
user_id
profile_name
status
created_at
updated_at


## voice_embeddings

id
voice_profile_id
embedding_reference
sample_type
created_at


IMPORTANT:

Do not expose raw voice embeddings through normal API responses.


## topics

id
meeting_id
topic
description
confidence
created_at


## decisions

id
meeting_id
decision_text
confidence
created_at


## commitments

id
meeting_id
commitment_text
owner_id
deadline
status
confidence
created_at
updated_at


## action_items

id
meeting_id
task
owner_id
deadline
status
confidence
created_at
updated_at


## evidence

id
meeting_id
entity_type
entity_id
transcript_segment_id
quote
speaker_id
start_time
end_time
created_at


## contradictions

id
meeting_id
entity_type
old_value
new_value
old_evidence_id
new_evidence_id
created_at


## customer_requirements

id
meeting_id
requirement
priority
confidence
created_at


## customer_concerns

id
meeting_id
concern
priority
confidence
created_at


## dependencies

id
meeting_id
dependent_action_id
dependency_description
dependency_action_id
created_at


## reports

id
meeting_id
report_data
created_at
updated_at


# 13. DATABASE RELATIONSHIPS

Main relationship:

User
 │
 ├── Meetings
 │      │
 │      ├── Participants
 │      ├── Audio Files
 │      ├── Processing Jobs
 │      ├── Transcript Segments
 │      ├── Speakers
 │      ├── Topics
 │      ├── Decisions
 │      ├── Commitments
 │      ├── Action Items
 │      ├── Evidence
 │      ├── Contradictions
 │      ├── Requirements
 │      ├── Concerns
 │      ├── Dependencies
 │      └── Reports
 │
 └── Voice Profile
        └── Voice Embeddings


# 14. DATABASE ACCESS LAYER

Do not put raw SQL/database operations directly inside route handlers.

Use a repository/data-access layer.

Recommended structure:

server/
├── db/
│   ├── database.js
│   ├── migrations/
│   └── repositories/
│
├── middleware/
│   ├── authMiddleware.js
│   └── authorizationMiddleware.js
│
├── routes/
│   ├── authRoutes.js
│   ├── meetingRoutes.js
│   ├── audioRoutes.js
│   ├── actionRoutes.js
│   └── userRoutes.js
│
├── controllers/
│
└── services/


# 15. DATABASE CONFIGURATION

Use environment variables.

Example:

DATABASE_URL=

Never hardcode database credentials.

Create:

.env.example

Do NOT commit:

.env


# 16. MEETING OWNERSHIP

When creating a meeting:

POST /api/meetings

automatically assign:

owner_id = authenticated_user.id

Never accept owner_id blindly from the frontend.

The backend determines ownership from the authenticated session.


# 17. MEETING CODE

Generate unique meeting codes server-side.

Example:

G13-X7K9P

Requirements:

- unique
- non-sequential where practical
- difficult to guess
- associated with exactly one active meeting

Do not trust a client-provided meeting ID as authorization.


# 18. MEETING ACCESS

Implement:

POST /api/meetings

GET /api/meetings

GET /api/meetings/:id

POST /api/meetings/join

PATCH /api/meetings/:id

DELETE /api/meetings/:id

Access rules:

Owner:
- full control

Participant:
- allowed meeting data

Unauthenticated user:
- only allowed to join if the application explicitly supports
  public meeting-code joining

Do not expose private meeting information.


# 19. AUDIO OWNERSHIP

When a user uploads audio:

uploaded_by = authenticated_user.id

meeting_id = validated meeting

The backend must verify that the user has permission to upload
to that meeting.

Audio files must never be publicly accessible by arbitrary filename.

Avoid:

/uploads/random-user-audio.mp3

being directly accessible without authorization.


# 20. PROCESSING JOB OWNERSHIP

Every processing job must be associated with:

user
meeting
audio file

A user must only be able to retrieve job status for resources
they are authorized to access.


# 21. ACTION TRACKER

Action items must be stored persistently.

Required:

task
owner
deadline
status
confidence
meeting_id

Supported statuses:

Committed
In Progress
Completed
Needs Clarification
Cancelled

Implement:

GET /api/actions
GET /api/actions/:id
PATCH /api/actions/:id


# 22. ACTION AUTHORIZATION

A user may modify an action only if:

- they own the meeting
OR
- they are an authorized participant with appropriate permission

Do not allow arbitrary action modification through an exposed ID.


# 23. TRANSCRIPT ACCESS

Implement protected endpoint:

GET /api/meetings/:id/transcript

Return transcript only if the authenticated user has access
to the meeting.


# 24. REPORT ACCESS

Implement:

GET /api/meetings/:id/report

The report must belong to the requested meeting.

Never return another user's report.


# 25. VOICE PROFILE SECURITY

Voice profile belongs to:

user_id

Only the authenticated user should be able to manage their own
voice enrollment unless an explicit administrative policy exists.

Endpoints:

POST /api/voice-profile/enroll
GET /api/voice-profile
DELETE /api/voice-profile

Protect all three with authentication.

Do not return raw embeddings.

Return only safe metadata such as:

profile status
number of enrolled samples
created_at
updated_at


# 26. SOCKET.IO AUTHENTICATION

The existing backend uses Socket.IO.

Secure Socket.IO connections.

Authenticate the socket connection using the user's token.

After authentication:

socket.user = authenticated_user

When joining:

meeting room

verify that the user has permission to join the meeting.

Do NOT allow:

socket.emit("join_room", arbitraryMeetingId)

to bypass meeting authorization.


# 27. SOCKET ROOM SECURITY

Before joining:

meeting:{meetingId}

verify:

- token valid
- user authorized
- meeting exists

Then:

socket.join(`meeting:${meetingId}`)


# 28. SOCKET EVENTS

Preserve the existing frontend-compatible events:

job_stage_update
job_completed
job_failed
transcript_turn
commitment_detected
speaker_active

Do not break existing Socket.IO consumers.

Every event should only be broadcast to users authorized for
the corresponding meeting.


# 29. API RESPONSE FORMAT

Use consistent responses.

Success:

{
  "success": true,
  "data": {}
}

Error:

{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}


# 30. SECURITY REQUIREMENTS

Implement:

- password hashing
- JWT validation
- refresh token handling
- authentication middleware
- authorization middleware
- input validation
- rate limiting architecture
- secure CORS
- safe file handling
- SQL injection protection through parameterized queries/ORM
- secure HTTP headers where appropriate
- no password logging
- no token logging
- no secret logging

Never return:

password_hash
refresh_token
raw voice embedding
database credentials


# 31. DATABASE MIGRATION

Create proper database migrations/schema.

Do not manually create tables every time the server starts.

Database initialization should be predictable and safe.

If using Supabase/PostgreSQL,
provide the SQL schema/migration required to create the tables.


# 32. LOCAL DEVELOPMENT

The backend must support:

LOCAL DEVELOPMENT

with environment variables.

Example:

DATABASE_URL=postgresql://...

For development, if PostgreSQL is not configured yet,
allow the existing JSON persistence to remain as a temporary fallback
only where technically necessary.

Clearly label it as:

development fallback

Never treat JSON persistence as the final production database.


# 33. PRODUCTION DATABASE

Production should use:

PostgreSQL / Supabase PostgreSQL

All important persistent data should be stored in the database.

The local filesystem should only be used for:

temporary processing files

unless a proper object-storage system is configured.


# 34. FILE STORAGE

Audio files are currently stored under:

uploads/audio/

Preserve this during local development.

For production architecture, prepare support for:

Supabase Storage

or another private object storage provider.

Store the storage reference/path in:

audio_files.storage_path

Do not store large audio binaries directly inside PostgreSQL.


# 35. AUTHENTICATION + FRONTEND COMPATIBILITY

Inspect:

src/services/api.js
src/services/authService.js
src/context/AuthContext.jsx

before changing backend authentication.

The backend response must match the frontend's existing expectations
where possible.

Do not force unnecessary frontend rewrites.

If a backend response must change,
identify exactly which frontend service needs a compatibility update.


# 36. REQUIRED ENVIRONMENT VARIABLES

Create:

.env.example

with:

NODE_ENV=development
PORT=5000

DATABASE_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=

FRONTEND_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

Only use Supabase variables if Supabase is actually selected.

Never expose:

SUPABASE_SERVICE_ROLE_KEY

to the frontend.


# 37. ACCOUNT SECURITY

Registration validation:

- valid email
- minimum password requirements
- duplicate email detection
- sanitized name

Login:

- generic invalid credentials error
- do not reveal whether an email exists

Example:

"Invalid email or password."

Do not return:

"Email exists but password is wrong."


# 38. TOKEN STORAGE

Design the backend to support secure refresh-token handling.

Prefer:

short-lived access token
+
secure refresh-token mechanism

Refresh tokens should be stored securely and revocable.

Do not store plaintext refresh tokens in the database if avoidable;
store a secure hash/reference.


# 39. LOGOUT

Logout must revoke/invalidate the refresh session.

Do not simply return:

200 OK

without actually invalidating the refresh mechanism.


# 40. DATABASE INDEXES

Add indexes for common queries:

users.email
meetings.owner_id
meetings.meeting_code
meetings.created_at
meeting_participants.meeting_id
audio_files.meeting_id
processing_jobs.meeting_id
transcript_segments.meeting_id
action_items.meeting_id
action_items.owner_id
action_items.deadline
evidence.meeting_id


# 41. DATA INTEGRITY

Use:

foreign keys
unique constraints
NOT NULL where appropriate
timestamps
cascade rules where appropriate

Do not allow orphan records unnecessarily.


# 42. API DOCUMENTATION

Document all backend endpoints.

Authentication endpoints:

POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET /api/auth/me

Meeting endpoints:

POST /api/meetings
GET /api/meetings
GET /api/meetings/:id
PATCH /api/meetings/:id
DELETE /api/meetings/:id
POST /api/meetings/join

Audio endpoints:

POST /api/audio/upload
GET /api/jobs/:id

Transcript:

GET /api/meetings/:id/transcript

Report:

GET /api/meetings/:id/report

Actions:

GET /api/actions
PATCH /api/actions/:id

Voice:

POST /api/voice-profile/enroll
GET /api/voice-profile
DELETE /api/voice-profile


# 43. TESTING

Create backend tests for:

Authentication:
- register
- duplicate register
- login
- invalid password
- invalid token
- expired token
- refresh
- logout

Authorization:
- user cannot access another user's meeting
- user cannot access another user's audio
- user cannot modify another user's action
- user cannot access another user's report

Database:
- meeting creation
- participant relationship
- action persistence
- transcript persistence

Socket.IO:
- authenticated connection
- unauthorized connection
- authorized room joining
- unauthorized room joining


# 44. MIGRATION FROM CURRENT JSON STORAGE

Do not immediately delete:

uploads/meetings.json

First:

1. Inspect its current structure.
2. Map existing fields to database entities.
3. Create migration/import logic if required.
4. Verify data.
5. Switch production reads/writes to database.
6. Keep JSON only as development fallback if necessary.

Do not silently lose existing meeting data.


# 45. RENDER DEPLOYMENT

The backend must remain compatible with Render Web Service.

Typical configuration:

Runtime:
Node

Build Command:

npm install

Start Command:

npm start

or the actual command defined by the existing project.

Use:

process.env.PORT

The server must listen on:

0.0.0.0

Do not hardcode port 5000 for production.


# 46. FINAL IMPLEMENTATION RULE

DO NOT implement the entire AI intelligence pipeline again.

The existing project already contains processing services.

Your responsibility in this task is to create a strong backend foundation around
those existing services:

AUTHENTICATION
+
AUTHORIZATION
+
DATABASE
+
PERSISTENCE
+
API SECURITY
+
MEETING OWNERSHIP
+
SOCKET SECURITY
+
FILE OWNERSHIP
+
FRONTEND API COMPATIBILITY


# 47. EXECUTION ORDER

First inspect the repository.

Then report:

1. Existing backend structure
2. Existing authentication implementation
3. Existing meeting persistence
4. Existing API endpoints
5. Existing frontend API contracts
6. Existing Socket.IO flow
7. Existing data structures
8. What can be preserved
9. What must be changed
10. Database migration plan

Then implement in this order:

PHASE 1:
Authentication

PHASE 2:
Authorization

PHASE 3:
PostgreSQL database layer

PHASE 4:
Meeting/user relationships

PHASE 5:
Audio/job persistence

PHASE 6:
Transcript/report/action persistence

PHASE 7:
Socket.IO authentication and room authorization

PHASE 8:
Frontend API compatibility

PHASE 9:
Security hardening

PHASE 10:
Testing

PHASE 11:
Render deployment configuration


# FINAL REQUIREMENT

Do not create fake users.
Do not create fake database records.
Do not bypass authentication.
Do not expose private meeting data.
Do not store passwords in plaintext.
Do not expose secrets.
Do not expose raw voice embeddings.
Do not break existing API contracts without explaining the required frontend change.

Use the existing project as the source of truth.

Build the backend around what is already implemented.
