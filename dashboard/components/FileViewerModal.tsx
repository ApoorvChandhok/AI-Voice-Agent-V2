'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  X, Download, Copy, CheckCircle, FileText, FileCode, Table2, Hash,
  Loader2, Trash2, AlertTriangle, Maximize2, Minimize2,
} from 'lucide-react'

interface FileInfo {
  name: string
  size: number
  modified: string
  ext: string
  content?: string
}

interface Props {
  mode: 'inbound' | 'outbound'
  fileName: string
  onClose: () => void
  onDeleted?: (fileName: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function getFileIcon(ext: string) {
  switch (ext) {
    case '.csv':  return <Table2   className="w-4 h-4" />
    case '.json': return <FileCode className="w-4 h-4" />
    case '.md':   return <Hash     className="w-4 h-4" />
    default:      return <FileText className="w-4 h-4" />
  }
}

function getExtColor(ext: string): string {
  switch (ext) {
    case '.csv':  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case '.json': return 'text-amber-400  bg-amber-500/10  border-amber-500/20'
    case '.md':   return 'text-sky-400    bg-sky-500/10    border-sky-500/20'
    default:      return 'text-violet-400 bg-violet-500/10 border-violet-500/20'
  }
}

// ── Line-numbered renderer ────────────────────────────────────────────────────

function LineNumberedContent({ content, ext }: { content: string; ext: string }) {
  const lines = content.split('\n')
  const displayed = ext === '.json'
    ? (() => { try { return JSON.stringify(JSON.parse(content), null, 2) } catch { return content } })()
    : content

  return (
    <div className="flex text-xs font-mono leading-6 overflow-x-auto min-h-full">
      {/* Line numbers */}
      <div
        className="select-none pr-4 text-right text-white/20 border-r border-white/[0.06] shrink-0"
        style={{ minWidth: `${String(lines.length).length + 2}ch` }}
      >
        {displayed.split('\n').map((_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      {/* Content */}
      <pre className="flex-1 pl-4 text-white/80 whitespace-pre-wrap break-words">
        {displayed}
      </pre>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function FileViewerModal({ mode, fileName, onClose, onDeleted }: Props) {
  const [file, setFile]               = useState<FileInfo | null>(null)
  const [loading, setLoading]         = useState(true)
  const [copied, setCopied]           = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [fullscreen, setFullscreen]   = useState(false)   // ← new

  const fetchFile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/agent-config/files?mode=${mode}&file=${encodeURIComponent(fileName)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFile(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [mode, fileName])

  useEffect(() => { fetchFile() }, [fetchFile])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fullscreen) setFullscreen(false)
        else onClose()
      }
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setFullscreen(f => !f)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, fullscreen])

  const handleCopy = () => {
    if (!file?.content) return
    navigator.clipboard.writeText(file.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    if (!file?.content) return
    const blob = new Blob([file.content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res  = await fetch(`/api/agent-config/files?mode=${mode}&file=${encodeURIComponent(fileName)}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onDeleted?.(fileName)
      onClose()
    } catch (e: any) {
      setError(e.message)
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const lineCount = file?.content?.split('\n').length ?? 0
  const charCount = file?.content?.length ?? 0

  // ── Panel geometry: side panel vs fullscreen ──────────────────────────────
  const panelClass = fullscreen
    ? 'fixed inset-4 z-[110] flex flex-col rounded-2xl bg-[#0d0d1a] border border-white/[0.1] shadow-2xl'
    : 'fixed inset-y-0 right-0 z-[110] flex flex-col w-full max-w-2xl bg-[#0d0d1a] border-l border-white/[0.08] shadow-2xl'

  const panelAnimation = fullscreen ? 'fileViewZoomIn 0.18s cubic-bezier(0.4,0,0.2,1)' : 'fileViewSlideIn 0.2s cubic-bezier(0.4,0,0.2,1)'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[3px]"
        onClick={() => fullscreen ? setFullscreen(false) : onClose()}
      />

      {/* Modal panel */}
      <div className={panelClass} style={{ animation: panelAnimation }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-start gap-3 px-5 py-4 border-b border-white/[0.07]">
          <div className={`p-2 rounded-xl border ${file ? getExtColor(file.ext) : 'text-white/30 bg-white/5 border-white/10'}`}>
            {file ? getFileIcon(file.ext) : <FileText className="w-4 h-4" />}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{fileName}</h2>
            {file && (
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="text-[10px] text-white/30">{formatBytes(file.size)}</span>
                <span className="text-[10px] text-white/30">{lineCount} lines · {charCount.toLocaleString()} chars</span>
                <span className="text-[10px] text-white/30">Modified {formatDate(file.modified)}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase ${getExtColor(file.ext)}`}>
                  {mode}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Copy */}
            <button onClick={handleCopy} disabled={!file?.content} title="Copy content (Ctrl+C)"
              className="p-2 rounded-lg hover:bg-white/[0.07] text-white/30 hover:text-white/70 transition-all disabled:opacity-30">
              {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download */}
            <button onClick={handleDownload} disabled={!file?.content} title="Download file"
              className="p-2 rounded-lg hover:bg-white/[0.07] text-white/30 hover:text-white/70 transition-all disabled:opacity-30">
              <Download className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button onClick={() => setConfirmDelete(true)} disabled={deleting} title="Delete file"
              className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all disabled:opacity-30">
              <Trash2 className="w-4 h-4" />
            </button>

            {/* ── Fullscreen toggle ── */}
            <button
              onClick={() => setFullscreen(f => !f)}
              title={fullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen (Ctrl+F)'}
              className="p-2 rounded-lg hover:bg-indigo-500/10 text-white/30 hover:text-indigo-400 transition-all ml-1"
            >
              {fullscreen
                ? <Minimize2 className="w-4 h-4" />
                : <Maximize2 className="w-4 h-4" />
              }
            </button>

            {/* Close */}
            <button onClick={onClose} title="Close (Esc)"
              className="p-2 rounded-lg hover:bg-white/[0.07] text-white/30 hover:text-white/70 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Delete confirmation ──────────────────────────────────────────── */}
        {confirmDelete && (
          <div className="shrink-0 mx-5 mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300">Delete this file?</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                This will permanently delete <span className="font-mono">{fileName}</span> from disk. This cannot be undone.
              </p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-white/10 text-white/50 hover:bg-white/[0.05] transition-all">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="px-3 py-1.5 text-xs rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50">
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  {deleting ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Content area ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              <p className="text-sm text-white/30">Loading file…</p>
            </div>
          )}
          {error && (
            <div className="mx-5 mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}
          {file?.content != null && !loading && (
            <div className="p-5 h-full">
              {file.ext === '.csv' ? (
                <CsvTable content={file.content} />
              ) : (
                <div className={`rounded-xl bg-[#080810] border border-white/[0.06] p-4 overflow-auto ${fullscreen ? 'min-h-full' : ''}`}>
                  <LineNumberedContent content={file.content} ext={file.ext} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {file && (
          <div className="shrink-0 border-t border-white/[0.06] px-5 py-3 flex items-center justify-between">
            <span className="text-[11px] text-white/20 font-mono">
              data/resources/{mode}/{fileName}
              {fullscreen && (
                <span className="ml-3 text-white/10">· Press Esc or click outside to exit fullscreen</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {!fullscreen && (
                <button
                  onClick={() => setFullscreen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all"
                >
                  <Maximize2 className="w-3 h-3" />
                  Full screen
                </button>
              )}
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-600/70 hover:bg-violet-500 text-white transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fileViewSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fileViewZoomIn {
          from { transform: scale(0.96); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  )
}

// ── CSV table renderer ────────────────────────────────────────────────────────

function CsvTable({ content }: { content: string }) {
  const lines = content.trim().split('\n')
  if (lines.length === 0) return <p className="text-white/30 text-xs">Empty file</p>

  const firstLine = lines[0]
  const delimiter = firstLine.includes('\t') ? '\t' : ','
  const headers   = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''))
  const rows      = lines.slice(1).map(l => l.split(delimiter).map(c => c.trim().replace(/^"|"$/g, '')))
  const preview   = rows.slice(0, 200)   // show more rows in fullscreen

  return (
    <div className="space-y-2 h-full flex flex-col">
      {rows.length > 200 && (
        <p className="text-xs text-amber-400/70 shrink-0">Showing first 200 of {rows.length} rows</p>
      )}
      <div className="rounded-xl overflow-auto border border-white/[0.07] bg-[#080810] flex-1">
        <table className="w-full text-xs">
          <thead className="bg-white/[0.04] border-b border-white/[0.07] sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-white/20 font-mono w-10">#</th>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-white/50 font-semibold whitespace-nowrap">{h || `col_${i + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, ri) => (
              <tr key={ri} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                <td className="px-3 py-2 text-white/20 font-mono">{ri + 1}</td>
                {headers.map((_, ci) => (
                  <td key={ci} className="px-3 py-2 text-white/60 font-mono max-w-[240px] truncate" title={row[ci] ?? ''}>
                    {row[ci] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-white/20 shrink-0">{headers.length} columns · {rows.length} rows</p>
    </div>
  )
}
