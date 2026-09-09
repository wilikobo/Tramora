import { Link } from 'react-router-dom'

const SIDE_PHOTO =
  'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1200&q=80'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="relative min-h-screen bg-paper">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-2">
        {/* Left — brand + form */}
        <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" width="40" height="40" alt="Wayra" className="rounded-full" />
            <span className="font-display text-xl text-ink">Wayra</span>
          </Link>

          <div className="mx-auto w-full max-w-md py-14">
            <div className="mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky/20 bg-sky/5 px-3 py-1 text-xs font-medium text-sky-deep">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-forest" />
                A journey for two
              </div>
              <h2 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-3 text-base text-ink-soft">{subtitle}</p>
              ) : null}
            </div>

            {children}

            {footer ? (
              <div className="mt-8 text-sm text-ink-muted">{footer}</div>
            ) : null}
          </div>

          <div className="hidden text-xs tracking-[0.28em] text-ink-muted lg:block">
            © {new Date().getFullYear()} · WAYRA
          </div>
        </section>

        {/* Right — postcard */}
        <section className="relative hidden overflow-hidden lg:block">
          <img
            src={SIDE_PHOTO}
            alt="Golden hour over the coast"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-ink/70 via-ink/20 to-transparent"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-sky/40 via-transparent to-transparent mix-blend-multiply"
          />

          <div className="relative flex h-full flex-col justify-end p-12 text-white">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-white/80">
              Wayra · Postcards
            </div>
            <h3 className="font-display text-4xl leading-tight sm:text-5xl">
              Two travellers,
              <br />
              <span className="italic text-sand-soft">one story</span>.
            </h3>
            <p className="mt-4 max-w-md text-white/85">
              Sign in and pick up the map exactly where you left it — the pins,
              the plans, the places still waiting.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-white/70">
              <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 backdrop-blur-sm">
                120+ countries
              </span>
              <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 backdrop-blur-sm">
                Shared trip planning
              </span>
              <span className="rounded-full border border-white/30 bg-white/10 px-3 py-1 backdrop-blur-sm">
                Memories, mapped
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
