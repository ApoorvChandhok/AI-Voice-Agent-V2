'use client'

import { useState } from 'react'

interface Props {
  onClose: () => void
  onCreated: () => void
}

type Step = 'details' | 'telephony' | 'admin' | 'provisioning' | 'done'

const STEPS: { id: Step; label: string }[] = [
  { id: 'details',      label: 'Workspace Details' },
  { id: 'telephony',    label: 'Telephony Config'   },
  { id: 'admin',        label: 'Admin Account'      },
  { id: 'provisioning', label: 'Auto-Provision'     },
  { id: 'done',         label: 'Done'               },
]

interface FormState {
  name:          string
  slug:          string
  phoneNumber:   string
  adminEmail:    string
  adminName:     string
  rateOutbound:  string
  rateInbound:   string
  sipDomain:     string
  vobizUsername: string
  vobizPassword: string
}

const DEFAULT_FORM: FormState = {
  name:         '',
  slug:         '',
  phoneNumber:  '',
  adminEmail:   '',
  adminName:    '',
  rateOutbound: '0.020000',
  rateInbound:  '0.010000',
  sipDomain:    '',
  vobizUsername: '',
  vobizPassword: '',
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex(s => s.id === current)
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              idx < currentIdx  ? 'bg-violet-500 border-violet-500 text-white' :
              idx === currentIdx ? 'bg-transparent border-violet-400 text-violet-400' :
                                   'bg-transparent border-white/15 text-white/25'
            }`}>
              {idx < currentIdx
                ? <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M2 5.5L4.5 8L9 3"/></svg>
                : idx + 1}
            </div>
            <span className={`text-[10px] whitespace-nowrap transition-colors ${
              idx === currentIdx ? 'text-violet-400' : idx < currentIdx ? 'text-white/50' : 'text-white/20'
            }`}>{step.label}</span>
          </div>
          {idx < STEPS.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-5 transition-colors ${
              idx < currentIdx ? 'bg-violet-500' : 'bg-white/10'
            }`}/>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Field({
  label, name, value, onChange, type = 'text', placeholder, hint, prefix,
}: {
  label: string; name: keyof FormState; value: string;
  onChange: (k: keyof FormState, v: string) => void;
  type?: string; placeholder?: string; hint?: string; prefix?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/60">{label}</label>
      <div className="flex items-center rounded-lg border border-white/[0.1] bg-white/[0.04] overflow-hidden focus-within:border-violet-500/50 focus-within:bg-white/[0.06] transition-all">
        {prefix && <span className="px-3 text-sm text-white/30 border-r border-white/[0.08]">{prefix}</span>}
        <input
          type={type}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 bg-transparent text-sm text-white placeholder-white/20 outline-none"
        />
      </div>
      {hint && <span className="text-[11px] text-white/25">{hint}</span>}
    </div>
  )
}

// ── Provision step log line ───────────────────────────────────────────────────
function LogLine({ text, status }: { text: string; status: 'done' | 'loading' | 'pending' }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        {status === 'done'    && <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><path d="M2.5 7L6 10.5L11.5 4"/></svg>}
        {status === 'loading' && <div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin"/>}
        {status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-white/15"/>}
      </div>
      <span className={`text-sm ${status === 'done' ? 'text-white/70' : status === 'loading' ? 'text-white/90' : 'text-white/25'}`}>
        {text}
      </span>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function CreateWorkspaceModal({ onClose, onCreated }: Props) {
  const [step, setStep]       = useState<Step>('details')
  const [form, setForm]       = useState<FormState>(DEFAULT_FORM)
  const [busy, setBusy]       = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [provisionWarning, setProvisionWarning] = useState<string | null>(null)
  const [provisionLog, setProvisionLog] = useState<{ text: string; status: 'done' | 'loading' | 'pending' }[]>([])

  const setField = (k: keyof FormState, v: string) => {
    setForm(prev => {
      const next = { ...prev, [k]: v }
      // Auto-derive slug from name
      if (k === 'name') next.slug = toSlug(v)
      return next
    })
  }

  // Safe step navigation — always clears stale errors
  const goToStep = (s: Step) => {
    setApiError(null)
    setStep(s)
  }

  const handleCreate = async () => {
    setBusy(true)
    setApiError(null)
    setStep('provisioning')

    const steps = [
      'Creating workspace record…',
      'Setting billing rates…',
      'Provisioning outbound SIP trunk…',
      'Provisioning inbound SIP trunk…',
      'Creating dispatch rule…',
      'Inviting admin via email…',
    ]

    // Show sequential log animation while API call runs
    const log = steps.map((text, i) => ({
      text,
      status: (i === 0 ? 'loading' : 'pending') as 'done' | 'loading' | 'pending',
    }))
    setProvisionLog([...log])

    // Tick through steps while the real API call runs
    let i = 0
    const tick = setInterval(() => {
      setProvisionLog(prev => prev.map((l, idx) => ({
        ...l,
        status: idx < i ? 'done' : idx === i ? 'loading' : 'pending',
      })))
      i++
      if (i >= steps.length) clearInterval(tick)
    }, 700)

    try {
      const res = await fetch('/api/super-admin/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          form.name,
          slug:          form.slug,
          phone_number:  form.phoneNumber,
          admin_email:   form.adminEmail,
          admin_name:    form.adminName,
          rate_outbound: parseFloat(form.rateOutbound),
          rate_inbound:  parseFloat(form.rateInbound),
          sip_domain:    form.sipDomain,
          vobiz_username:form.vobizUsername,
          vobiz_password:form.vobizPassword,
        }),
      })

      clearInterval(tick)

      if (!res.ok) {
        // Safely parse error — server may return empty body on crash
        let errMsg = 'Failed to create workspace'
        try {
          const errBody = await res.json()
          errMsg = errBody.error ?? errMsg
        } catch {
          errMsg = `Server error (${res.status})`
        }
        setApiError(errMsg)
        setStep('admin')  // go back to last user-input step, not details
        return
      }

      // Mark all done — check for non-fatal provisioning warning
      const result = await res.json()
      if (result.provision_warning) {
        setProvisionWarning(result.provision_warning)
      }
      setProvisionLog(steps.map(text => ({ text, status: 'done' })))
      setTimeout(() => setStep('done'), 600)
    } catch (e: unknown) {
      clearInterval(tick)
      setApiError(e instanceof Error ? e.message : 'Network error')
      setStep('admin')
    } finally {
      setBusy(false)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-xl bg-[#121220] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">Create Workspace</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-all">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12"/>
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-6">
          <StepIndicator current={step} />

          {/* Error */}
          {apiError && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {apiError}
            </div>
          )}

          {/* ── Step: Details ── */}
          {step === 'details' && (
            <div className="flex flex-col gap-4">
              <Field label="Workspace Name" name="name" value={form.name} onChange={setField} placeholder="e.g. Acme Corp" />
              <Field label="Slug (URL identifier)" name="slug" value={form.slug} onChange={setField} placeholder="acme-corp" prefix="/" hint="Auto-generated from name. Lowercase, no spaces." />
              <Field label="DID Phone Number" name="phoneNumber" value={form.phoneNumber} onChange={setField} placeholder="+918065XXXXXX" hint="The Vobiz DID number assigned to this workspace." />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Outbound Rate ($/min)" name="rateOutbound" value={form.rateOutbound} onChange={setField} type="number" hint="What you charge the client." />
                <Field label="Inbound Rate ($/min)" name="rateInbound" value={form.rateInbound} onChange={setField} type="number" />
              </div>
              <button
                disabled={!form.name || !form.slug}
                onClick={() => goToStep('telephony')}
                className="mt-2 w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-white/25 text-white text-sm font-medium transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* ── Step: Telephony ── */}
          {step === 'telephony' && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs">
                Enter the client's Vobiz SIP credentials to provision their isolated LiveKit trunks.
              </div>
              <Field label="SIP Domain" name="sipDomain" value={form.sipDomain} onChange={setField} placeholder="sip.vobiz.com" />
              <Field label="Vobiz Username" name="vobizUsername" value={form.vobizUsername} onChange={setField} placeholder="client-username" />
              <Field label="Vobiz Password" name="vobizPassword" value={form.vobizPassword} onChange={setField} type="password" placeholder="••••••••" />
              <div className="flex gap-3 mt-2">
                <button onClick={() => goToStep('details')} className="flex-1 py-2.5 rounded-lg border border-white/[0.1] text-white/60 text-sm hover:bg-white/[0.04] transition-all">
                  Back
                </button>
                <button
                  disabled={!form.sipDomain || !form.vobizUsername || !form.vobizPassword}
                  onClick={() => goToStep('admin')}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-white/25 text-white text-sm font-medium transition-all"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Admin ── */}
          {step === 'admin' && (
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
                An email magic link will be sent to the admin. They don't need Google OAuth — just click the link to set a password and access their workspace.
              </div>
              <Field label="Admin Email" name="adminEmail" value={form.adminEmail} onChange={setField} type="email" placeholder="admin@client.com" />
              <Field label="Admin Full Name" name="adminName" value={form.adminName} onChange={setField} placeholder="Jane Smith" />
              <div className="flex gap-3 mt-2">
                <button onClick={() => goToStep('telephony')} className="flex-1 py-2.5 rounded-lg border border-white/[0.1] text-white/60 text-sm hover:bg-white/[0.04] transition-all">
                  Back
                </button>
                <button
                  disabled={!form.adminEmail}
                  onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-white/25 text-white text-sm font-medium transition-all"
                >
                  Create & Provision
                </button>
              </div>
            </div>
          )}

          {/* ── Step: Provisioning ── */}
          {step === 'provisioning' && (
            <div className="flex flex-col gap-1">
              <p className="text-sm text-white/50 mb-4">Setting up infrastructure — this takes a few seconds…</p>
              {provisionLog.map((l, i) => <LogLine key={i} text={l.text} status={l.status} />)}
            </div>
          )}

          {/* ── Step: Done ── */}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Workspace Created</p>
                <p className="text-sm text-white/40 mt-1">
                  <strong className="text-white/70">{form.name}</strong> is live. Magic link sent to <strong className="text-white/70">{form.adminEmail}</strong>.
                </p>
              </div>
              {provisionWarning && (
                <div className="w-full px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex gap-2 items-start">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
                    <path d="M7 1L13 12H1L7 1Z"/><path d="M7 5.5v3"/><circle cx="7" cy="10" r="0.5" fill="currentColor"/>
                  </svg>
                  <span><strong>LiveKit trunks not provisioned:</strong> {provisionWarning} You can add them manually in workspace settings.</span>
                </div>
              )}
              <button
                onClick={onCreated}
                className="px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-all"
              >
                Back to Workspaces
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
