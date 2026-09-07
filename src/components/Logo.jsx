export default function Logo({ size = 48, animate = false }) {
  const style = { width: size, height: size }
  return (
    <div
      className={`relative flex items-center justify-center rounded-full ${
        animate ? 'animate-breathe' : ''
      }`}
      style={style}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(closest-side, rgba(20,184,166,0.35), rgba(20,184,166,0) 70%)',
        }}
      />
      <div
        className="relative flex items-center justify-center rounded-full border border-teal/40 bg-navy-soft/80 backdrop-blur"
        style={{ width: size, height: size }}
      >
        <div
          className="rounded-full bg-teal shadow-glow"
          style={{ width: size * 0.5, height: size * 0.5 }}
        />
        <span
          className="absolute rounded-full bg-gold"
          style={{
            width: Math.max(4, size * 0.08),
            height: Math.max(4, size * 0.08),
            right: size * 0.18,
            top: size * 0.22,
          }}
        />
      </div>
    </div>
  )
}
