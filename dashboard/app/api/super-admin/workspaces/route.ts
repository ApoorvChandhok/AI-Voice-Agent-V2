import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()

  // Auth + role check (middleware also guards this, defense-in-depth)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Fetch all businesses ────────────────────────────────────────────────────
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, slug, phone_number, is_active, created_at')
    .order('created_at', { ascending: true })

  if (bizError) return NextResponse.json({ error: bizError.message }, { status: 500 })

  const bizIds = (businesses ?? []).map(b => b.id)

  // ── Fetch workspace configs (trunk IDs) ─────────────────────────────────────
  const { data: configs, error: configError } = await supabase
    .from('workspace_config')
    .select('business_id, livekit_trunk_id, inbound_trunk_id, vobiz_did_number, dispatch_rule_id, agent_name_outbound, agent_name_inbound')

  if (configError) {
    console.error('[workspaces GET] workspace_config error:', configError.message)
  }

  // ── Fetch billing rates ─────────────────────────────────────────────────────
  const { data: rates, error: ratesError } = await supabase
    .from('workspace_billing_rates')
    .select('business_id, rate_outbound_per_min, rate_inbound_per_min, stt_rate_per_min, tts_rate_per_min, llm_rate_per_token, livekit_rate_per_min')

  if (ratesError) {
    console.error('[workspaces GET] billing_rates error:', ratesError.message)
  }

  // ── Fetch weekly spend view ─────────────────────────────────────────────────
  const { data: spends, error: spendError } = await supabase
    .from('weekly_workspace_spend')
    .select('*')

  if (spendError) {
    console.error('[workspaces GET] weekly_workspace_spend error:', spendError.message)
  }

  // ── Fallback: direct call_logs aggregate (if view returns nothing) ──────────
  // The view only returns rows for businesses WITH calls in the past 7 days.
  // If spends is empty/null we pull a direct count per business.
  const directCounts: Record<string, { total_calls: number; total_minutes: number; total_spend_usd: number; inbound_calls: number; outbound_calls: number }> = {}

  if (!spends || spends.length === 0) {
    const { data: callData } = await supabase
      .from('call_logs')
      .select('business_id, direction, duration_seconds, status')
      .in('business_id', bizIds)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    for (const row of callData ?? []) {
      if (!directCounts[row.business_id]) {
        directCounts[row.business_id] = { total_calls: 0, total_minutes: 0, total_spend_usd: 0, inbound_calls: 0, outbound_calls: 0 }
      }
      const d = directCounts[row.business_id]
      d.total_calls++
      const mins = (row.duration_seconds ?? 0) / 60
      d.total_minutes += mins
      if (row.direction === 'inbound')  d.inbound_calls++
      if (row.direction === 'outbound') d.outbound_calls++
    }
  }

  // ── Fetch all call logs total (lifetime, not just 7d) ──────────────────────
  const { data: allCallsData } = await supabase
    .from('call_logs')
    .select('business_id, direction, duration_seconds, status')
    .in('business_id', bizIds)

  const allCallsMap: Record<string, { total: number; completed: number; total_mins: number }> = {}
  for (const row of allCallsData ?? []) {
    if (!allCallsMap[row.business_id]) allCallsMap[row.business_id] = { total: 0, completed: 0, total_mins: 0 }
    allCallsMap[row.business_id].total++
    if (row.status === 'completed') allCallsMap[row.business_id].completed++
    allCallsMap[row.business_id].total_mins += (row.duration_seconds ?? 0) / 60
  }

  // ── Fetch admin (owner) emails per business ─────────────────────────────────
  const { data: admins } = await supabase
    .from('profiles')
    .select('business_id, email, full_name, role')
    .in('role', ['admin', 'super_admin'])

  // ── Merge into WorkspaceRow shape ───────────────────────────────────────────
  const configMap  = Object.fromEntries((configs ?? []).map(c => [c.business_id, c]))
  const spendMap   = Object.fromEntries((spends  ?? []).map(s => [s.business_id, s]))
  const ratesMap   = Object.fromEntries((rates   ?? []).map(r => [r.business_id, r]))

  // Admin map: prefer 'admin' role, fallback to first match
  const adminMap: Record<string, { email: string; full_name: string }> = {}
  for (const a of (admins ?? [])) {
    if (!adminMap[a.business_id] || a.role === 'admin') {
      adminMap[a.business_id] = { email: a.email, full_name: a.full_name ?? '' }
    }
  }

  const workspaces = (businesses ?? []).map(biz => {
    const spend = spendMap[biz.id] ?? directCounts[biz.id] ?? null
    const cfg   = configMap[biz.id] ?? null
    const rate  = ratesMap[biz.id] ?? null
    const allC  = allCallsMap[biz.id] ?? null

    return {
      id:               biz.id,
      name:             biz.name,
      slug:             biz.slug ?? null,
      phone_number:     biz.phone_number ?? null,
      is_active:        biz.is_active ?? true,
      created_at:       biz.created_at,
      owner_email:      adminMap[biz.id]?.email ?? null,
      owner_name:       adminMap[biz.id]?.full_name ?? null,
      // SIP config
      livekit_trunk_id:    cfg?.livekit_trunk_id    ?? null,
      inbound_trunk_id:    cfg?.inbound_trunk_id    ?? null,
      vobiz_did_number:    cfg?.vobiz_did_number    ?? null,
      dispatch_rule_id:    cfg?.dispatch_rule_id    ?? null,
      agent_name_outbound: cfg?.agent_name_outbound ?? null,
      agent_name_inbound:  cfg?.agent_name_inbound  ?? null,
      // Billing rates
      rate_outbound_per_min: Number(rate?.rate_outbound_per_min ?? 0.02),
      rate_inbound_per_min:  Number(rate?.rate_inbound_per_min  ?? 0.01),
      stt_rate_per_min:      Number(rate?.stt_rate_per_min      ?? 0.0043),
      tts_rate_per_min:      Number(rate?.tts_rate_per_min      ?? 0.004),
      // 7-day stats
      total_calls:     Number(spend?.total_calls     ?? 0),
      total_minutes:   Number(spend?.total_minutes   ?? 0),
      total_spend_usd: Number(spend?.total_spend_usd ?? 0),
      inbound_calls:   Number(spend?.inbound_calls   ?? 0),
      outbound_calls:  Number(spend?.outbound_calls  ?? 0),
      // Lifetime stats
      lifetime_calls:     allC?.total      ?? 0,
      lifetime_mins:      allC?.total_mins ?? 0,
      lifetime_completed: allC?.completed  ?? 0,
    }
  })

  return NextResponse.json({ workspaces })
}
