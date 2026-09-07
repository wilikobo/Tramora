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
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-navy-line bg-navy-deep/70 p-1 backdrop-blur">
      {TABS.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.to ? `/trips/${tripId}/${tab.to}` : `/trips/${tripId}`}
          end={tab.end}
          className={({ isActive }) =>
            [
              'rounded-full px-4 py-1.5 text-xs tracking-wide transition-colors',
              isActive
                ? 'bg-teal/20 text-white shadow-[0_0_20px_-8px_rgba(20,184,166,0.55)]'
                : 'text-mist/70 hover:text-white',
            ].join(' ')
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
