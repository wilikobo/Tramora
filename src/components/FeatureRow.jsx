import { motion } from 'framer-motion'

const features = [
  {
    title: 'Plan together',
    body: 'Shape every trip as a duo — drop pins, drafts and dreams into one shared canvas.',
    icon: PlanIcon,
    tone: 'sky',
  },
  {
    title: 'Track your world',
    body: 'Watch your map fill up as you go — done, planned, wishlist, all in one calm view.',
    icon: GlobeIcon,
    tone: 'forest',
  },
  {
    title: 'AI suggestions',
    body: 'Get thoughtful ideas for your next chapter, tuned to how the two of you travel.',
    icon: SparkIcon,
    tone: 'sand',
  },
]

const TONES = {
  sky: {
    bg: 'bg-sky/10',
    text: 'text-sky',
    ring: 'group-hover:ring-sky/40',
  },
  forest: {
    bg: 'bg-forest/10',
    text: 'text-forest',
    ring: 'group-hover:ring-forest/40',
  },
  sand: {
    bg: 'bg-sand/15',
    text: 'text-[#B45309]',
    ring: 'group-hover:ring-sand/40',
  },
}

export default function FeatureRow() {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-7">
      {features.map((f, i) => {
        const tone = TONES[f.tone]
        return (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={[
              'group relative flex flex-col items-start rounded-2xl bg-white p-7 shadow-card ring-1 ring-slate-100 transition-all duration-300',
              'hover:-translate-y-1 hover:shadow-lift',
              tone.ring,
            ].join(' ')}
          >
            <div
              className={[
                'mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
                tone.bg,
                tone.text,
              ].join(' ')}
            >
              <f.icon />
            </div>
            <h3 className="headline text-xl leading-snug">{f.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{f.body}</p>
            <span className={['mt-6 text-sm font-medium transition-colors', tone.text].join(' ')}>
              Learn more →
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}

function PlanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2V6z" />
      <path d="M10 4v14" />
      <path d="M14 6v14" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c3 3.5 3 14 0 18" />
      <path d="M12 3c-3 3.5-3 14 0 18" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="M6 6l2.5 2.5" />
      <path d="M15.5 15.5L18 18" />
      <path d="M6 18l2.5-2.5" />
      <path d="M15.5 8.5L18 6" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
