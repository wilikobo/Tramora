import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import WorldContour from '../components/WorldContour.jsx'
import TripTabs from '../components/TripTabs.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { DEMO_BUDGET, DEMO_TRIP_NAME } from '../lib/demoTrip.js'

const CATEGORIES = [
  { key: 'flights',       label: 'Flights',       icon: '✈️', color: '#14B8A6' },
  { key: 'accommodation', label: 'Accommodation', icon: '🏠', color: '#F59E0B' },
  { key: 'food',          label: 'Food',          icon: '🍜', color: '#8B5CF6' },
  { key: 'activities',    label: 'Activities',    icon: '🎭', color: '#22C55E' },
  { key: 'transport',     label: 'Transport',     icon: '🚌', color: '#FB923C' },
  { key: 'other',         label: 'Practical / Other', icon: '💊', color: '#EF4444' },
]

const EMPTY = {
  total_budget: 0,
  flights: 0,
  accommodation: 0,
  food: 0,
  activities: 0,
  transport: 0,
  other: 0,
}

export default function Budget() {
  const { tripId } = useParams()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [trip, setTrip] = useState(null)
  const [budget, setBudget] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [error, setError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  const displayName = profile?.username ?? user?.user_metadata?.username ?? 'traveller'

  const loadAll = useCallback(async () => {
    if (!tripId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: tripRow, error: tripErr } = await supabase
        .from('trips')
        .select('id, name')
        .eq('id', tripId)
        .single()
      if (tripErr) throw tripErr
      setTrip(tripRow)

      const { data: budgetRow, error: budgetErr } = await supabase
        .from('trip_budget')
        .select('total_budget, flights, accommodation, food, activities, transport, other')
        .eq('trip_id', tripId)
        .maybeSingle()
      if (budgetErr) throw budgetErr
      console.debug('[Budget] loaded row for trip', tripId, budgetRow)

      const toNum = (v) => {
        if (v === null || v === undefined || v === '') return 0
        const n = typeof v === 'string' ? parseFloat(v) : Number(v)
        return Number.isFinite(n) ? n : 0
      }

      let normalized = budgetRow
        ? {
            total_budget: toNum(budgetRow.total_budget),
            flights: toNum(budgetRow.flights),
            accommodation: toNum(budgetRow.accommodation),
            food: toNum(budgetRow.food),
            activities: toNum(budgetRow.activities),
            transport: toNum(budgetRow.transport),
            other: toNum(budgetRow.other),
          }
        : { ...EMPTY }

      const allZero = Object.values(normalized).every((v) => v === 0)
      const isDemoTrip = tripRow?.name === DEMO_TRIP_NAME

      if (isDemoTrip && (!budgetRow || allZero)) {
        const seedPayload = { trip_id: tripId, ...DEMO_BUDGET, updated_at: new Date().toISOString() }
        const { error: seedErr } = await supabase
          .from('trip_budget')
          .upsert(seedPayload, { onConflict: 'trip_id' })
        if (seedErr) {
          console.warn('[Budget] demo seed failed:', seedErr)
        } else {
          normalized = { ...DEMO_BUDGET }
        }
      }

      setBudget(normalized)
    } catch (err) {
      console.error('[Budget] load failed:', err)
      setError(err.message ?? 'Could not load budget.')
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  const sumCategories = useMemo(
    () =>
      CATEGORIES.reduce((acc, c) => acc + (Number(budget[c.key]) || 0), 0),
    [budget],
  )

  const totalBudget = Number(budget.total_budget) || 0
  const remaining = totalBudget - sumCategories

  const chartData = useMemo(
    () =>
      CATEGORIES
        .map((c) => ({
          name: c.label,
          value: Number(budget[c.key]) || 0,
          color: c.color,
        }))
        .filter((d) => d.value > 0),
    [budget],
  )

  function setField(key, value) {
    const num = value === '' ? 0 : Number(value)
    setBudget((prev) => ({ ...prev, [key]: Number.isFinite(num) ? num : 0 }))
  }

  async function handleSave() {
    if (!tripId) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        trip_id: tripId,
        total_budget: budget.total_budget,
        flights: budget.flights,
        accommodation: budget.accommodation,
        food: budget.food,
        activities: budget.activities,
        transport: budget.transport,
        other: budget.other,
        updated_at: new Date().toISOString(),
      }
      const { error: upErr } = await supabase
        .from('trip_budget')
        .upsert(payload, { onConflict: 'trip_id' })
      if (upErr) throw upErr
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1600)
    } catch (err) {
      setError(err.message ?? 'Could not save budget.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-navy">
      <div className="pointer-events-none absolute inset-0 z-0">
        <WorldContour className="h-full w-full" opacity={0.04} />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src="/logo.png" width="44" height="44" alt="Wayra" className="rounded-full" />
          <span className="font-display text-xl text-white">Wayra</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-6">
          <NavLink to="/dashboard" className={navClass} end>Home</NavLink>
          <NavLink to="/map" className={navClass}>Map</NavLink>
          <NavLink to="/trips" className={navClass}>Trips</NavLink>
          <span className="hidden text-sm text-mist/60 sm:inline">{displayName}</span>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="btn-ghost !px-4 !py-2 text-sm"
          >
            {signingOut ? '…' : 'Sign out'}
          </button>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-2">
        <div className="mb-4 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-teal-soft">
          <span className="h-px w-8 bg-teal/60" />
          <span>BUDGET</span>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="headline text-3xl sm:text-4xl">
              {trip?.name ? <>{trip.name}<span className="text-gold">.</span></> : 'Trip budget.'}
            </h1>
            <p className="mt-2 text-mist/70">
              Split it, plan it, spend it well. Every euro accounted for.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedFlash ? (
              <span className="text-xs tracking-widest text-teal-soft">SAVED ✓</span>
            ) : null}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="btn-primary"
            >
              {saving ? 'Saving…' : 'Save budget'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <TripTabs tripId={tripId} />
        </div>

        {error ? (
          <p className="mt-6 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-10 text-sm text-mist/60">Loading budget…</p>
        ) : (
          <>
            <div className="mt-10 rounded-2xl border border-navy-line bg-navy-soft/40 p-6">
              <label htmlFor="total-budget" className="auth-label">Total trip budget</label>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-display text-white">€</span>
                <input
                  id="total-budget"
                  type="number"
                  min="0"
                  step="1"
                  value={budget.total_budget || ''}
                  onChange={(e) => setField('total_budget', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-navy-line bg-navy-deep/60 px-4 py-3 text-3xl font-display text-white placeholder:text-mist/30 focus:border-teal/60 focus:outline-none focus:ring-2 focus:ring-teal/20"
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="text-mist/60">Allocated:</span>
                <span className="text-white tabular-nums">€{sumCategories.toFixed(0)}</span>
                <span className="text-mist/60">Remaining:</span>
                <span
                  className={[
                    'tabular-nums font-medium',
                    remaining < 0 ? 'text-red-300' : 'text-teal-soft',
                  ].join(' ')}
                >
                  €{remaining.toFixed(0)}
                </span>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-navy-line bg-navy-soft/40 p-6">
                <div className="mb-4 text-[11px] tracking-[0.32em] text-muted">
                  DISTRIBUTION
                </div>
                <div className="mx-auto h-[340px] w-full max-w-md">
                  {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-mist/50">
                      Enter amounts below to see the split.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={130}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {chartData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: '#0F172A',
                            border: '1px solid #1E293B',
                            borderRadius: 12,
                            color: '#E2E8F0',
                          }}
                          formatter={(value) => [`€${Number(value).toFixed(0)}`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-navy-line bg-navy-soft/40 p-6">
                <div className="mb-4 text-[11px] tracking-[0.32em] text-muted">
                  CATEGORIES
                </div>
                <div className="space-y-3">
                  {CATEGORIES.map((c) => (
                    <div key={c.key} className="flex items-center gap-3">
                      <span className="text-lg leading-none">{c.icon}</span>
                      <label htmlFor={`cat-${c.key}`} className="min-w-[130px] text-sm text-mist/80">
                        {c.label}
                      </label>
                      <div className="flex flex-1 items-center gap-2">
                        <span className="text-sm text-mist/60">€</span>
                        <input
                          id={`cat-${c.key}`}
                          type="number"
                          min="0"
                          step="1"
                          value={budget[c.key] || ''}
                          onChange={(e) => setField(c.key, e.target.value)}
                          placeholder="0"
                          className="w-full rounded-lg border border-navy-line bg-navy-deep/60 px-3 py-1.5 text-sm text-mist focus:border-teal/60 focus:outline-none focus:ring-1 focus:ring-teal/30"
                          style={{ borderLeft: `3px solid ${c.color}` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-navy-line bg-navy-soft/40">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-line text-left text-[10px] tracking-[0.32em] text-muted">
                    <th className="px-5 py-3 font-medium">CATEGORY</th>
                    <th className="px-5 py-3 font-medium text-right">BUDGET</th>
                    <th className="px-5 py-3 font-medium text-right">% OF TOTAL</th>
                    <th className="px-5 py-3 font-medium text-right">% OF ALLOCATED</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((c) => {
                    const val = Number(budget[c.key]) || 0
                    const pctTotal = totalBudget > 0 ? (val / totalBudget) * 100 : 0
                    const pctAlloc = sumCategories > 0 ? (val / sumCategories) * 100 : 0
                    return (
                      <tr key={c.key} className="border-b border-navy-line/60 last:border-b-0">
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-2 text-mist">
                            <span
                              className="inline-block h-3 w-3 rounded-sm"
                              style={{ backgroundColor: c.color }}
                            />
                            <span className="text-base leading-none">{c.icon}</span>
                            <span>{c.label}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-white">
                          €{val.toFixed(0)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-mist/70">
                          {pctTotal.toFixed(1)}%
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-mist/70">
                          {pctAlloc.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-navy-deep/40 font-medium">
                    <td className="px-5 py-3 text-mist/80">Total allocated</td>
                    <td className="px-5 py-3 text-right tabular-nums text-white">
                      €{sumCategories.toFixed(0)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-mist/70">
                      {totalBudget > 0 ? ((sumCategories / totalBudget) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-mist/70">100.0%</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3 text-mist/80">Remaining</td>
                    <td
                      className={[
                        'px-5 py-3 text-right tabular-nums font-medium',
                        remaining < 0 ? 'text-red-300' : 'text-teal-soft',
                      ].join(' ')}
                    >
                      €{remaining.toFixed(0)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-mist/70">
                      {totalBudget > 0 ? ((remaining / totalBudget) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="px-5 py-3 text-right text-mist/40">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

function navClass({ isActive }) {
  return [
    'text-sm tracking-wide transition-colors',
    isActive ? 'text-white' : 'text-mist/70 hover:text-white',
  ].join(' ')
}
