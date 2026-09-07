import { Link } from 'react-router-dom'
import WorldContour from './WorldContour.jsx'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-navy">
      {/* Backdrop world map */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <WorldContour className="h-full w-full" opacity={0.05} />
      </div>

      {/* Ambient glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute -left-20 top-1/3 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, rgba(20,184,166,0.25), rgba(20,184,166,0) 70%)',
          }}
        />
        <div
          className="absolute right-[-10%] bottom-[-15%] h-[460px] w-[460px] rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, rgba(245,158,11,0.14), rgba(245,158,11,0) 70%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-12 px-6 py-10 lg:grid-cols-2 lg:gap-16 lg:py-16">
        {/* Left — brand + quote */}
        <section className="flex flex-col justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" width="44" height="44" alt="Wayra" className="rounded-full" />
            <span className="font-display text-xl text-white">Wayra</span>
          </Link>

          <div className="relative py-16">
            <div className="pointer-events-none absolute inset-0 -z-0 opacity-[0.08]">
              <WorldContour className="h-full w-full" color="#F59E0B" opacity={1} />
            </div>
            <div className="relative">
              <div className="mb-6 flex items-center gap-3 text-[11px] font-medium tracking-[0.32em] text-gold">
                <span className="h-px w-8 bg-gold/60" />
                <span>A JOURNEY FOR TWO</span>
              </div>
              <h1 className="font-display text-5xl leading-[1.05] text-white sm:text-6xl">
                Two travellers,
                <br />
                <span className="italic">
                  <span className="bg-gradient-to-r from-gold via-gold-soft to-gold bg-clip-text text-transparent">
                    one story
                  </span>
                </span>
                .
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-mist/70">
                Sign in and pick up the map exactly where you left it — the pins,
                the plans, the places still waiting.
              </p>
            </div>
          </div>

          <div className="hidden text-[11px] tracking-[0.32em] text-muted lg:block">
            © {new Date().getFullYear()} · WAYRA
          </div>
        </section>

        {/* Right — form card */}
        <section className="flex items-center">
          <div className="w-full rounded-2xl border border-navy-line bg-navy-soft/60 p-8 shadow-soft backdrop-blur-sm sm:p-10">
            <div className="mb-8">
              <h2 className="font-display text-3xl text-white sm:text-4xl">{title}</h2>
              {subtitle ? (
                <p className="mt-3 text-sm text-mist/70">{subtitle}</p>
              ) : null}
            </div>

            {children}

            {footer ? <div className="mt-8 text-sm text-muted">{footer}</div> : null}
          </div>
        </section>
      </div>
    </main>
  )
}
