import { motion } from 'framer-motion'

const features = [
  {
    title: 'Plan together',
    body: 'Shape every trip as a duo — drop pins, drafts and dreams into one shared canvas.',
    icon: PlanIcon,
  },
  {
    title: 'Track your world',
    body: 'Watch your map fill up as you go — done, planned, wishlist, all in one view.',
    icon: GlobeIcon,
  },
  {
    title: 'AI suggestions',
    body: 'Get thoughtful ideas for your next chapter, tuned to how the two of you travel.',
    icon: SparkIcon,
  },
]

export default function FeatureRow() {
  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-10 px-2 sm:grid-cols-3 sm:gap-8">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start"
        >
          <div className="mb-5 flex items-center gap-3">
            <f.icon />
            <span className="h-px w-8 bg-gold/50" />
          </div>
          <h3 className="headline text-xl leading-snug">{f.title}</h3>
          <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-mist/70">
            {f.body}
          </p>
        </motion.div>
      ))}
    </div>
  )
}

function IconFrame({ children }) {
  return (
    <span className="relative inline-flex h-11 w-11 items-center justify-center">
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(20,184,166,0.28), rgba(20,184,166,0) 70%)',
        }}
      />
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-teal/30 text-teal-soft">
        {children}
      </span>
    </span>
  )
}

function PlanIcon() {
  return (
    <IconFrame>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6l6-2 4 2 6-2v14l-6 2-4-2-6 2V6z" />
        <path d="M10 4v14" />
        <path d="M14 6v14" />
        <circle cx="17.5" cy="10" r="1" fill="#F59E0B" stroke="none" />
      </svg>
    </IconFrame>
  )
}

function GlobeIcon() {
  return (
    <IconFrame>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c3 3.5 3 14 0 18" />
        <path d="M12 3c-3 3.5-3 14 0 18" />
        <circle cx="15.5" cy="8.5" r="1.1" fill="#F59E0B" stroke="none" />
      </svg>
    </IconFrame>
  )
}

function SparkIcon() {
  return (
    <IconFrame>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v4" />
        <path d="M12 17v4" />
        <path d="M3 12h4" />
        <path d="M17 12h4" />
        <path d="M6 6l2.5 2.5" />
        <path d="M15.5 15.5L18 18" />
        <path d="M6 18l2.5-2.5" />
        <path d="M15.5 8.5L18 6" />
        <circle cx="12" cy="12" r="2.2" fill="#F59E0B" stroke="none" />
      </svg>
    </IconFrame>
  )
}
