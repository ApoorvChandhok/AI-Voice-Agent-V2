'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

export interface RoomRow {
  id: string;
  name: string;
  creationTime: number;
  durationMs: number;
  metadata: any;
  workspaceName: string;
  didNumber: string | null;    // DID line the call came in on
  callerNumber: string | null; // External caller's phone number
  participants: Array<{
    identity: string;
    state: string;
    joinedAt: number | null;
    attributes?: Record<string, string>;
  }>;
}

interface KillEvent {
  id: string;
  type: 'kill';
  roomName: string;
  workspaceName: string;
  didNumber: string | null;
  actorId: string;
  participantsRemoved: number;
  timestamp: string;
  metadata: any;
}

interface CallLog {
  room_name: string;
  workspace_id: string | null;
  workspace_name: string;
  did_number: string | null;
  direction: 'inbound' | 'outbound';
  phone_number: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: string;
}

// ── Live Duration Hook ────────────────────────────────────────────────────────
// Counts up every second from creationTime — no API poll needed.
function useLiveDuration(creationTime: number) {
  const [elapsed, setElapsed] = useState(Date.now() - creationTime)
  useEffect(() => {
    const id = setInterval(() => setElapsed(Date.now() - creationTime), 1000)
    return () => clearInterval(id)
  }, [creationTime])
  return elapsed
}

function formatElapsed(ms: number) {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  return `${m}:${String(s).padStart(2,'0')}`
}

// ── Room Drawer ─────────────────────────────────────────────────────────────

interface TranscriptEntry {
  ts: string;
  role: 'user' | 'agent';
  text: string;
}

function RoomDrawer({ room, onClose }: { room: RoomRow; onClose: () => void }) {
  const [drawerTab, setDrawerTab] = useState<'info' | 'transcript'>('transcript')
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const transcriptEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const elapsed = useLiveDuration(room.creationTime)

  const fetchTranscript = useCallback(async () => {
    try {
      const res = await fetch(`/api/super-admin/rooms/transcript?room=${encodeURIComponent(room.name)}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setTranscript(data.transcript ?? [])
      setTranscriptError(null)
    } catch (e: any) {
      setTranscriptError(e.message || 'Failed to load transcript')
    } finally {
      setTranscriptLoading(false)
    }
  }, [room.name])

  // Auto-poll transcript every 5s while drawer is open
  useEffect(() => {
    setTranscriptLoading(true)
    fetchTranscript()
    pollRef.current = setInterval(fetchTranscript, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchTranscript])

  // Auto-scroll transcript to bottom on new messages
  useEffect(() => {
    if (drawerTab === 'transcript') {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [transcript, drawerTab])

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="fixed top-0 right-0 z-[90] h-full w-full max-w-[480px] bg-[#0e0e1c] border-l border-white/[0.08] shadow-2xl flex flex-col"
        style={{ animation: 'slideIn 0.22s cubic-bezier(0.4,0,0.2,1)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-white truncate">{room.name}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-white/30 truncate">ID: {room.id}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 tabular-nums">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"/>
                {formatElapsed(elapsed)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all shrink-0 mt-0.5">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l10 10M12 2L2 12"/></svg>
          </button>
        </div>

        {/* Drawer tabs */}
        <div className="flex gap-0 border-b border-white/[0.06] shrink-0">
          <button
            onClick={() => setDrawerTab('transcript')}
            className={`flex-1 py-2.5 text-xs font-medium transition-all border-b-2 ${
              drawerTab === 'transcript'
                ? 'text-violet-300 border-violet-500 bg-violet-500/5'
                : 'text-white/30 border-transparent hover:text-white/60'
            }`}
          >
            <span className="flex items-center justify-center gap-1.5">
              {transcript.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              )}
              Live Transcript
              {transcript.length > 0 && (
                <span className="px-1.5 rounded-full text-[9px] bg-white/10 text-white/40 tabular-nums">
                  {transcript.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setDrawerTab('info')}
            className={`flex-1 py-2.5 text-xs font-medium transition-all border-b-2 ${
              drawerTab === 'info'
                ? 'text-violet-300 border-violet-500 bg-violet-500/5'
                : 'text-white/30 border-transparent hover:text-white/60'
            }`}
          >
            Room Info
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {drawerTab === 'transcript' ? (
            <div className="h-full flex flex-col">
              {transcriptLoading && transcript.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-white/30 text-sm">
                  <span className="animate-pulse">Loading transcript…</span>
                </div>
              ) : transcriptError ? (
                <div className="flex-1 flex items-center justify-center px-6 text-center text-red-400 text-sm">
                  {transcriptError}
                </div>
              ) : transcript.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/25 text-sm">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-30">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <div className="text-center">
                    <p>No transcript yet</p>
                    <p className="text-[11px] mt-1 text-white/15">Transcripts appear after the first turn</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-0 px-4 py-4 space-y-1">
                  {transcript.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col gap-0.5 ${
                        entry.role === 'user' ? 'items-start' : 'items-end'
                      }`}
                    >
                      <span className={`text-[9px] font-mono uppercase tracking-wider mb-0.5 ${
                        entry.role === 'user' ? 'text-sky-400/60' : 'text-violet-400/60'
                      }`}>
                        {entry.role === 'user' ? '▶ Caller' : '◀ Agent'} · {entry.ts.split(' ')[1]}
                      </span>
                      <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                        entry.role === 'user'
                          ? 'bg-sky-500/10 text-sky-100 border border-sky-500/15 rounded-tl-sm'
                          : 'bg-violet-500/10 text-violet-100 border border-violet-500/15 rounded-tr-sm'
                      }`}>
                        {entry.text}
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-4 space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1 font-medium">Workspace</p>
                <span className="text-sm text-white/90">{room.workspaceName}</span>
              </div>
              {room.didNumber && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1 font-medium">DID Number (Line)</p>
                  <span className="text-sm font-mono text-cyan-300">{room.didNumber}</span>
                </div>
              )}
              {room.callerNumber && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1 font-medium">Caller Number</p>
                  <span className="text-sm font-mono text-white/80">{room.callerNumber}</span>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1 font-medium">Duration (live)</p>
                <span className="text-sm font-mono text-emerald-300 tabular-nums">{formatElapsed(elapsed)}</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1 font-medium">Created At</p>
                <span className="text-sm text-white/90">{new Date(room.creationTime).toLocaleString()}</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-2 font-medium">Metadata</p>
                <pre className="text-[10px] text-white/60 bg-white/[0.03] p-3 rounded-lg overflow-x-auto border border-white/[0.05]">
                  {JSON.stringify(room.metadata, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/25 mb-2 font-medium">Participants ({room.participants.length})</p>
                {room.participants.length === 0 ? (
                  <p className="text-[11px] text-white/30">No participants currently</p>
                ) : (
                  <div className="space-y-2">
                    {room.participants.map((p, idx) => (
                      <div key={idx} className="flex flex-col gap-1 p-3 rounded-lg border border-white/[0.05] bg-white/[0.02]">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/90 font-medium truncate" title={p.identity}>{p.identity}</span>
                          <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${p.state === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/50'}`}>
                            {p.state}
                          </span>
                        </div>
                        {p.joinedAt && <span className="text-[10px] text-white/40">Joined: {new Date(p.joinedAt).toLocaleString()}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/[0.06] px-5 py-4">
          <button onClick={onClose} className="w-full py-2 rounded-lg border border-white/[0.1] text-white/50 text-sm hover:bg-white/[0.04] hover:text-white/70 transition-all">
            Close
          </button>
        </div>
      </div>
    </>
  )
}


// ── History Panel ─────────────────────────────────────────────────────────────

function HistoryPanel({ events, callLogs, loading, error, onRefresh }: {
  events: KillEvent[];
  callLogs: CallLog[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const [subTab, setSubTab] = useState<'kills' | 'calls'>('kills')
  const [filter, setFilter] = useState('')

  const filteredKills = events.filter(ev =>
    !filter ||
    ev.workspaceName.toLowerCase().includes(filter.toLowerCase()) ||
    ev.roomName.toLowerCase().includes(filter.toLowerCase())
  )

  const filteredCalls = callLogs.filter(log =>
    !filter ||
    (log.workspace_name ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    (log.room_name ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    (log.phone_number ?? '').includes(filter)
  )

  const formatDur = (secs: number | null) => {
    if (!secs) return '—'
    const m = Math.floor(secs / 60), s = secs % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Filter + sub-tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Filter by workspace, room or number…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
        {/* Sub-tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] w-fit shrink-0">
          <button
            onClick={() => setSubTab('kills')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              subTab === 'kills' ? 'bg-red-600/60 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Kill Events
            {events.length > 0 && <span className="ml-1.5 px-1.5 rounded-full bg-white/10 text-white/50">{events.length}</span>}
          </button>
          <button
            onClick={() => setSubTab('calls')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              subTab === 'calls' ? 'bg-violet-600/60 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            Call Logs
            {callLogs.length > 0 && <span className="ml-1.5 px-1.5 rounded-full bg-white/10 text-white/50">{callLogs.length}</span>}
          </button>
        </div>
      </div>

      {/* ── Kill Events Table ── */}
      {subTab === 'kills' && (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="grid grid-cols-[2fr_1.3fr_1.1fr_1fr_1fr_1fr] bg-white/[0.03] border-b border-white/[0.06]">
            {['Room Name', 'Workspace', 'DID Number', 'Event', 'Participants', 'Timestamp'].map(h => (
              <div key={h} className="px-4 py-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">{h}</div>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] border-b border-white/[0.04] animate-pulse">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="px-4 py-4"><div className="h-3 rounded bg-white/[0.06] w-3/4"/></div>
                ))}
              </div>
            ))
          ) : error ? (
            <div className="px-6 py-10 text-center text-red-400 text-sm">{error}</div>
          ) : filteredKills.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/30 text-sm">
              {filter ? 'No events match your filter.' : 'No terminated rooms in the last 24 hours.'}
            </div>
          ) : (
            filteredKills.map((ev, idx) => (
              <div
                key={ev.id}
                className={`grid grid-cols-[2fr_1.3fr_1.1fr_1fr_1fr_1fr] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${idx === filteredKills.length - 1 ? 'border-b-0' : ''}`}
              >
                <div className="px-4 py-3 flex items-center">
                  <span className="text-xs font-mono text-white/70 truncate">{ev.roomName}</span>
                </div>
                <div className="px-4 py-3 flex items-center">
                  {ev.workspaceName && ev.workspaceName !== 'Unknown' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/20 truncate max-w-full">
                      {ev.workspaceName}
                    </span>
                  ) : (
                    <span className="text-sm text-white/30">Unknown</span>
                  )}
                </div>
                <div className="px-4 py-3 flex items-center">
                  {ev.didNumber ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 truncate max-w-full">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.22 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      {ev.didNumber}
                    </span>
                  ) : (
                    <span className="text-sm text-white/20">—</span>
                  )}
                </div>
                <div className="px-4 py-3 flex items-center">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                    Terminated
                  </span>
                </div>
                <div className="px-4 py-3 flex items-center">
                  <span className="text-sm text-white/50">{ev.participantsRemoved} removed</span>
                </div>
                <div className="px-4 py-3 flex items-center">
                  <span className="text-xs text-white/40 font-mono">
                    {new Date(ev.timestamp).toLocaleString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Call Logs Table ── */}
      {subTab === 'calls' && (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <div className="grid grid-cols-[1.8fr_1.3fr_0.7fr_1.1fr_0.8fr_0.7fr_1fr] bg-white/[0.03] border-b border-white/[0.06]">
            {['Room', 'Workspace', 'Dir', 'Phone Number', 'Duration', 'Status', 'Start Time'].map(h => (
              <div key={h} className="px-3 py-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">{h}</div>
            ))}
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-7 border-b border-white/[0.04] animate-pulse">
                {Array.from({ length: 7 }).map((_, j) => (
                  <div key={j} className="px-3 py-4"><div className="h-3 rounded bg-white/[0.06] w-3/4"/></div>
                ))}
              </div>
            ))
          ) : filteredCalls.length === 0 ? (
            <div className="px-6 py-10 text-center text-white/30 text-sm">
              {filter ? 'No call logs match your filter.' : 'No call logs in the last 24 hours.'}
            </div>
          ) : (
            filteredCalls.map((log, idx) => {
              const isInbound = log.direction === 'inbound'
              const statusColor = log.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : log.status === 'failed'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              return (
                <div
                  key={idx}
                  className={`grid grid-cols-[1.8fr_1.3fr_0.7fr_1.1fr_0.8fr_0.7fr_1fr] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${idx === filteredCalls.length - 1 ? 'border-b-0' : ''}`}
                >
                  <div className="px-3 py-3 flex items-center">
                    <span className="text-[11px] font-mono text-white/60 truncate">{log.room_name}</span>
                  </div>
                  <div className="px-3 py-3 flex items-center">
                    {log.workspace_name && log.workspace_name !== 'Unknown' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/20 truncate max-w-full">
                        {log.workspace_name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-white/25">Unknown</span>
                    )}
                  </div>
                  <div className="px-3 py-3 flex items-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isInbound
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {isInbound ? '↙ In' : '↗ Out'}
                    </span>
                  </div>
                  <div className="px-3 py-3 flex items-center">
                    {log.phone_number ? (
                      <span className="text-[11px] font-mono text-white/70">{log.phone_number}</span>
                    ) : (
                      <span className="text-[11px] text-white/25">—</span>
                    )}
                  </div>
                  <div className="px-3 py-3 flex items-center">
                    <span className="text-[11px] font-mono text-white/60 tabular-nums">{formatDur(log.duration_seconds)}</span>
                  </div>
                  <div className="px-3 py-3 flex items-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${statusColor}`}>
                      {log.status || '—'}
                    </span>
                  </div>
                  <div className="px-3 py-3 flex items-center">
                    <span className="text-[11px] text-white/40 font-mono">
                      {new Date(log.started_at).toLocaleString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <p className="text-[11px] text-white/20 text-right">Showing events from the last 24 hours</p>
    </div>
  )
}

// ── Live Room Row (has own per-row timer) ────────────────────────────────────

function LiveRoomRow({
  room, isLast, onView, confirmKillId, killingRoomId, onConfirmKill, onKill, getHealthColor,
}: {
  room: RoomRow;
  isLast: boolean;
  onView: () => void;
  confirmKillId: string | null;
  killingRoomId: string | null;
  onConfirmKill: (id: string | null) => void;
  onKill: (name: string) => void;
  getHealthColor: (ms: number) => string;
}) {
  const elapsed = useLiveDuration(room.creationTime)

  return (
    <div
      className={`grid grid-cols-[2.5fr_1.5fr_1fr_1fr_120px] border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group ${isLast ? 'border-b-0' : ''}`}
    >
      {/* Room name + workspace badge + DID stacked */}
      <div className="px-4 py-3 flex flex-col gap-1 justify-center">
        <span className="text-xs font-mono text-white/80 break-all leading-snug">{room.name}</span>
        {room.workspaceName && room.workspaceName !== 'Unknown' ? (
          <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/20">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0">
              <rect x="1" y="1" width="10" height="10" rx="2"/>
              <path d="M4 6h4M6 4v4"/>
            </svg>
            {room.workspaceName}
          </span>
        ) : (
          <span className="inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/30 border border-white/10">
            Unknown workspace
          </span>
        )}
        {room.didNumber && (
          <span className="inline-flex w-fit items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.22 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {room.didNumber}
          </span>
        )}
      </div>

      {/* Live duration — ticks every second */}
      <div className="px-4 py-3 flex items-center">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border tabular-nums ${getHealthColor(elapsed)}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
          {formatElapsed(elapsed)}
        </span>
      </div>

      {/* Participants */}
      <div className="px-4 py-3 flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span className="text-sm text-white/60">{room.participants.length}</span>
      </div>

      {/* Created at */}
      <div className="px-4 py-3 flex items-center text-xs text-white/40 font-mono">
        {new Date(room.creationTime).toLocaleTimeString()}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
        <button onClick={onView} title="View details"
          className="p-1.5 rounded-lg hover:bg-white/[0.07] text-white/40 hover:text-white/80 transition-all">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 6.5C1 6.5 3 2 6.5 2S12 6.5 12 6.5s-2 4.5-5.5 4.5S1 6.5 1 6.5Z"/>
            <circle cx="6.5" cy="6.5" r="1.5"/>
          </svg>
        </button>

        {confirmKillId === room.name ? (
          <>
            <button
              onClick={() => onKill(room.name)}
              disabled={killingRoomId === room.name}
              className="px-2 py-1 rounded text-[10px] font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all disabled:opacity-50"
            >
              {killingRoomId === room.name ? '…' : 'KILL'}
            </button>
            <button onClick={() => onConfirmKill(null)}
              className="p-1.5 rounded-lg hover:bg-white/[0.07] text-white/30 hover:text-white/60 transition-all">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M1 1l9 9M10 1L1 10"/>
              </svg>
            </button>
          </>
        ) : (
          <button onClick={() => onConfirmKill(room.name)} title="Terminate Call"
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
              <line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Monitor Component ──────────────────────────────────────────────────

export default function LiveRoomsMonitor() {
  const [innerTab, setInnerTab] = useState<'live' | 'history'>('live')

  // Live state
  const [rooms, setRooms] = useState<RoomRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<RoomRow | null>(null)
  const [killingRoomId, setKillingRoomId] = useState<string | null>(null)
  const [confirmKillId, setConfirmKillId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [wsFilter, setWsFilter] = useState('')

  // History state
  const [histEvents, setHistEvents] = useState<KillEvent[]>([])
  const [histCallLogs, setHistCallLogs] = useState<CallLog[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [histError, setHistError] = useState<string | null>(null)

  const fetchRooms = async (background = false) => {
    if (!background) setLoading(true)
    try {
      const res = await fetch('/api/super-admin/rooms')
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setRooms(data.rooms ?? [])
      setLastUpdated(new Date())
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistLoading(true)
    setHistError(null)
    try {
      const res = await fetch('/api/super-admin/rooms/history')
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setHistEvents(data.killEvents ?? [])
      setHistCallLogs(data.callLogs ?? [])
    } catch (e: any) {
      setHistError(e.message || 'Failed to load history')
    } finally {
      setHistLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
    // 30s is fine — duration is now a client-side live timer, not API-driven
    const intId = setInterval(() => fetchRooms(true), 30000)
    return () => clearInterval(intId)
  }, [])

  // Load history when tab switches
  useEffect(() => {
    if (innerTab === 'history') fetchHistory()
  }, [innerTab])

  const handleKill = async (roomName: string) => {
    setKillingRoomId(roomName)
    setConfirmKillId(null)
    setRooms(prev => prev.filter(r => r.name !== roomName))
    if (selectedRoom?.name === roomName) setSelectedRoom(null)
    try {
      const res = await fetch(`/api/super-admin/rooms/${encodeURIComponent(roomName)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        await fetchRooms(true)
        showToast(`❌ ${data.error ?? 'Failed to kill room'}`)
      } else {
        const removed = data.participantsRemoved ?? 0
        showToast(`✓ Call terminated — ${removed} participant${removed !== 1 ? 's' : ''} disconnected`)
        setTimeout(() => fetchRooms(true), 2000)
      }
    } catch (e: any) {
      await fetchRooms(true)
      showToast(`❌ ${e.message || 'Network error'}`)
    } finally {
      setKillingRoomId(null)
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 5000)
  }

  const getHealthColor = (ms: number) => {
    const mins = ms / 60000
    if (mins < 15) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    if (mins < 30) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-red-400 bg-red-500/10 border-red-500/20'
  }

  const filteredRooms = rooms.filter(r =>
    !wsFilter ||
    r.workspaceName.toLowerCase().includes(wsFilter.toLowerCase()) ||
    r.name.toLowerCase().includes(wsFilter.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Live Rooms</h2>
          <p className="text-sm text-white/40 mt-0.5">
            Real-time monitoring across all tenants
            {lastUpdated && (
              <span className="ml-2 text-white/20 text-[10px] font-mono">· updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => innerTab === 'live' ? fetchRooms(false) : fetchHistory()}
          disabled={loading || histLoading}
          title="Refresh"
          className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white/80 transition-all disabled:opacity-30"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            className={(loading || histLoading) ? 'animate-spin' : ''}>
            <path d="M11.5 2A5.5 5.5 0 1 0 12 7"/><path d="M11.5 2v3h-3"/>
          </svg>
        </button>
      </div>

      {/* Inner tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] w-fit">
        {(['live', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setInnerTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              innerTab === tab
                ? 'bg-violet-600/80 text-white shadow'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab === 'live' ? (
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${rooms.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`}/>
                Active Calls {rooms.length > 0 && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 rounded-full">{rooms.length}</span>}
              </span>
            ) : 'Room History (24h)'}
          </button>
        ))}
      </div>

      {innerTab === 'live' ? (
        <>
          {/* Workspace filter for live rooms */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="4.5"/><path d="M9.5 9.5L13 13" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Filter by workspace or room name…"
              value={wsFilter}
              onChange={e => setWsFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/50 transition-all"
            />
          </div>

          {/* Live rooms table */}
          <div className="rounded-xl border border-white/[0.07] overflow-hidden">
            <div className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_120px] bg-white/[0.03] border-b border-white/[0.06]">
              {['Room / Workspace', 'Duration ⏱', 'Participants', 'Created At', 'Actions'].map(h => (
                <div key={h} className="px-4 py-3 text-[11px] uppercase tracking-wider text-white/30 font-medium">{h}</div>
              ))}
            </div>

            {loading && rooms.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[2.5fr_1.5fr_1fr_1fr_120px] border-b border-white/[0.04] animate-pulse">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <div key={j} className="px-4 py-4"><div className="h-3 rounded bg-white/[0.06] w-3/4"/></div>
                  ))}
                </div>
              ))
            ) : error ? (
              <div className="px-6 py-12 text-center text-red-400 text-sm">{error}</div>
            ) : filteredRooms.length === 0 ? (
              <div className="px-6 py-12 text-center text-white/30 text-sm flex flex-col items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-20">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {wsFilter ? `No active rooms match "${wsFilter}"` : 'No active calls at the moment.'}
              </div>
            ) : (
              filteredRooms.map((room, idx) => (
                <LiveRoomRow
                  key={room.id}
                  room={room}
                  isLast={idx === filteredRooms.length - 1}
                  onView={() => setSelectedRoom(room)}
                  confirmKillId={confirmKillId}
                  killingRoomId={killingRoomId}
                  onConfirmKill={setConfirmKillId}
                  onKill={handleKill}
                  getHealthColor={getHealthColor}
                />
              ))
            )}
          </div>

        </>
      ) : (
        <HistoryPanel
          events={histEvents}
          callLogs={histCallLogs}
          loading={histLoading}
          error={histError}
          onRefresh={fetchHistory}
        />
      )}

      {selectedRoom && <RoomDrawer room={selectedRoom} onClose={() => setSelectedRoom(null)} />}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium shadow-2xl backdrop-blur-sm transition-all ${
          toast.startsWith('❌') ? 'bg-red-950/80 border-red-500/30 text-red-300' : 'bg-zinc-900/90 border-white/10 text-white/80'
        }`}>
          {toast}
        </div>
      )}
    </div>
  )
}
