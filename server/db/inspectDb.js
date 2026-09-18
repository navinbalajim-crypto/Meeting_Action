import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { isPostgresConnected, query, initDb, DB_FALLBACK_DIR } from './index.js';
import { userRepository } from '../repositories/userRepository.js';
import { meetingRepository } from '../repositories/meetingRepository.js';
import { actionRepository } from '../repositories/actionRepository.js';

dotenv.config();

async function inspect() {
  console.log('\n================================================================');
  console.log('📊 G13 AI Meeting Intelligence — Database Inspector');
  console.log('================================================================\n');

  await initDb();
  const pgActive = isPostgresConnected();

  console.log(`🔗 Connection Status: ${pgActive ? '🟢 Live PostgreSQL / Supabase' : '🟡 Local Development File-Backed DB'}`);
  if (pgActive) {
    console.log(`📡 Database Target: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  } else {
    console.log(`📂 Storage Path: ${DB_FALLBACK_DIR}`);
  }

  console.log('\n----------------------------------------------------------------');
  console.log('👤 TABLE: users');
  console.log('----------------------------------------------------------------');
  let users = [];
  if (pgActive) {
    const res = await query('SELECT id, name, email, role, organization, is_active, created_at, last_login_at FROM users');
    users = res.rows;
  } else {
    const usersPath = path.join(DB_FALLBACK_DIR, 'users.json');
    if (fs.existsSync(usersPath)) {
      const raw = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      users = raw.map(u => userRepository.toSafeUser(u));
    }
  }

  if (users.length === 0) {
    console.log('   (No users registered yet)');
  } else {
    console.table(users.map(u => ({
      ID: u.id,
      Name: u.name,
      Email: u.email,
      Role: u.role,
      Org: u.organization || 'General',
      Active: u.is_active,
      LastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'
    })));
  }

  console.log('\n----------------------------------------------------------------');
  console.log('📅 TABLE: meetings');
  console.log('----------------------------------------------------------------');
  let meetings = [];
  if (pgActive) {
    const res = await query('SELECT id, meeting_code, title, owner_id, client_name, status, duration, created_at FROM meetings ORDER BY created_at DESC LIMIT 10');
    meetings = res.rows.map(m => ({
      ID: m.id,
      Code: m.meeting_code,
      Title: m.title.length > 35 ? m.title.substring(0, 32) + '...' : m.title,
      Owner: m.owner_id,
      Client: m.client_name,
      Status: m.status,
      Duration: m.duration
    }));
  } else {
    const mPath = path.resolve('uploads', 'meetings.json');
    if (fs.existsSync(mPath)) {
      const raw = JSON.parse(fs.readFileSync(mPath, 'utf8'));
      meetings = raw.slice(0, 10).map(m => ({
        ID: m.id,
        Code: m.code,
        Title: (m.title || '').length > 35 ? (m.title || '').substring(0, 32) + '...' : (m.title || ''),
        Owner: m.owner_id || 'usr_anonymous',
        Client: m.client || 'Enterprise',
        Status: m.status,
        Duration: m.duration
      }));
    }
  }

  if (meetings.length === 0) {
    console.log('   (No meetings stored yet)');
  } else {
    console.table(meetings);
  }

  console.log('\n----------------------------------------------------------------');
  console.log('✅ TABLE: action_items (Commitments & Follow-up Tracker)');
  console.log('----------------------------------------------------------------');
  let actions = [];
  if (pgActive) {
    const res = await query('SELECT id, meeting_id, task, owner, deadline, status FROM action_items LIMIT 10');
    actions = res.rows.map(a => ({
      ID: a.id,
      Task: a.task.length > 40 ? a.task.substring(0, 37) + '...' : a.task,
      Owner: a.owner,
      Deadline: a.deadline,
      Status: a.status
    }));
  } else {
    const aPath = path.join(DB_FALLBACK_DIR, 'actions.json');
    if (fs.existsSync(aPath)) {
      const raw = JSON.parse(fs.readFileSync(aPath, 'utf8'));
      actions = raw.slice(0, 10).map(a => ({
        ID: a.id,
        Task: (a.task || '').length > 40 ? (a.task || '').substring(0, 37) + '...' : (a.task || ''),
        Owner: a.owner,
        Deadline: a.deadline,
        Status: a.status
      }));
    }
  }

  if (actions.length === 0) {
    console.log('   (No action items stored yet)');
  } else {
    console.table(actions);
  }

  console.log('\n----------------------------------------------------------------');
  console.log('🎙️ TABLE: audio_files (Acoustic Stats & Storage Assets)');
  console.log('----------------------------------------------------------------');
  let audioFiles = [];
  if (pgActive) {
    const res = await query('SELECT id, meeting_id, original_filename, mime_type, file_size, duration_sec, created_at FROM audio_files ORDER BY created_at DESC LIMIT 10');
    audioFiles = res.rows.map(a => ({
      ID: a.id,
      Meeting: a.meeting_id ? a.meeting_id.substring(0, 20) + '...' : 'None',
      File: a.original_filename,
      Type: a.mime_type,
      SizeKB: Math.round((a.file_size || 0) / 1024) + ' KB',
      Duration: a.duration_sec ? `${a.duration_sec.toFixed(1)}s` : 'N/A'
    }));
  }

  if (audioFiles.length === 0) {
    console.log('   (No audio_files records stored yet)');
  } else {
    console.table(audioFiles);
  }

  console.log('\n================================================================');
  console.log('💡 How to inspect the database:');
  console.log('1. Run `node server/db/inspectDb.js` in terminal anytime.');
  console.log('2. In development: open `uploads/db/` to see JSON data directly.');
  console.log('3. In production with Supabase/PostgreSQL: view tables in Supabase Studio Table Editor or connect via DBeaver/pgAdmin using DATABASE_URL.');
  console.log('================================================================\n');

  process.exit(0);
}

inspect();
