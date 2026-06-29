import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export const dynamic = 'force-dynamic';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve the logs directory — walks up from cwd to find the logs/ folder */
function resolveLogsDir(): string {
  const cwd = process.cwd();
  // npm run dev from dashboard/ → cwd = .../Ai-Voice-Calling-Agent-2.0/dashboard
  const candidates = [
    path.join(cwd, '..', 'logs'),   // from dashboard/
    path.join(cwd, 'logs'),         // from project root
    path.resolve(cwd, '..', 'logs'),
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return candidates[0];
}

interface TranscriptEntry {
  ts: string;
  role: 'user' | 'agent';
  text: string;
}

interface SystemEvent {
  ts: string;
  level: string;
  text: string;
}

/**
 * Actual format written by agent_inbound.py logger:
 *   2026-06-28 19:23:42 [INFO] inbound-agent: [TRANSCRIPT] ▶ USER : hello there
 *   2026-06-28 19:23:45 [INFO] inbound-agent: [TRANSCRIPT] ◀ AGENT: Sure, I can help!
 */
function parseTranscriptLine(line: string): TranscriptEntry | null {
  const m = line.match(
    /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\[INFO\]\s+\S+:\s+\[TRANSCRIPT\]\s+(▶|◀)\s+(USER|AGENT)[:\s]+(.+)$/u
  );
  if (!m) return null;
  const [, ts, arrow, , text] = m;
  return { ts, role: arrow === '▶' ? 'user' : 'agent', text: text.trim() };
}

function parseSystemLine(line: string): SystemEvent | null {
  const m = line.match(
    /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+\[(INFO|WARNING|ERROR)\]\s+\S+:\s+(\[INBOUND\].+|Agent state.+)$/
  );
  if (!m) return null;
  return { ts: m[1], level: m[2], text: m[3] };
}

/** Stream-read last N lines of a file efficiently */
async function readLogTail(filePath: string, tailLines = 3000): Promise<string[]> {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) { resolve([]); return; }
    const lines: string[] = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath, { encoding: 'utf8' }),
      crlfDelay: Infinity,
    });
    rl.on('line', (line) => {
      lines.push(line);
      if (lines.length > tailLines) lines.shift();
    });
    rl.on('close', () => resolve(lines));
    rl.on('error', () => resolve(lines));
  });
}

// ── Route Handler ─────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('auth_user_id', user.id).single();
    if (profile?.role !== 'super_admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const roomName = (searchParams.get('room') ?? '').trim();

    const logsDir = resolveLogsDir();
    const logFile = path.join(logsDir, 'inbound.log');

    // Debug info in response so you can verify the path
    const logFileExists = fs.existsSync(logFile);

    const rawLines = await readLogTail(logFile, 4000);

    const transcriptLines: TranscriptEntry[] = [];
    const systemEvents: SystemEvent[] = [];

    // ── Session-based filtering ──────────────────────────────────────────────
    // inbound.log uses the actual room name in the log line:
    //   [INBOUND] Room: SIP_abc123 | Job: ...
    // We scan for that session boundary, then collect lines until next session.
    //
    // If no room match found (e.g. room name format doesn't match), fall back
    // to returning ALL transcript lines from the file.

    let foundRoom = false;
    let inSession = false;

    if (roomName) {
      // Pass 1: check if the room name actually appears in the log
      foundRoom = rawLines.some(l => l.includes(`Room: ${roomName}`));
    }

    for (const line of rawLines) {
      if (roomName && foundRoom) {
        // Boundary detection
        if (line.includes(`Room: ${roomName}`)) {
          inSession = true;
        } else if (inSession && line.includes('Room:') && !line.includes(roomName)) {
          // New session for a different room — stop
          inSession = false;
        }
        if (!inSession) continue;
      }

      const t = parseTranscriptLine(line);
      if (t) { transcriptLines.push(t); continue; }

      const s = parseSystemLine(line);
      if (s) systemEvents.push(s);
    }

    return NextResponse.json({
      room: roomName,
      transcript: transcriptLines.slice(-300),
      systemEvents: systemEvents.slice(-80),
      // Debug fields — helps verify setup
      _debug: {
        logFile,
        logFileExists,
        rawLinesRead: rawLines.length,
        foundRoomInLog: foundRoom,
        transcriptCount: transcriptLines.length,
      },
    });

  } catch (err: any) {
    console.error('[Transcript API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
