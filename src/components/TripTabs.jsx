import { NavLink } from 'react-router-dom'

const TABS = [
  { to: '', label: 'Map', end: true },
  { to: 'activities', label: 'Activities' },
  { to: 'budget', label: 'Budget' },
  { to: 'resources', label: 'Resources' },
  { to: 'memories', label: 'Memories' },
]

export default function TripTabs({ tripId }) {
  if (!tripId) return null
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-card">
      {TABS.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.to ? `/trips/${tripId}/${tab.to}` : `/trips/${tripId}`}
          end={tab.end}
          className={({ isActive }) =>
            [
              'rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition-colors',
              isActive
                ? 'bg-sky text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]'
                : 'text-ink-soft hover:bg-slate-100 hover:text-ink',
            ].join(' ')
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
