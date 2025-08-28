export default function AuthLayout({
  title,
  subtitle,
  children,
  heroSrc = "/brand/sail-hero.png",
  logoSrc = "/brand/logo-mark.svg",
}) {
  return (
    <div className='min-h-screen grid md:grid-cols-2 bg-brand-surface-100 font-ui'>
      {/* Skip to main content (keyboard users) */}
      <a
        href='#main'
        className='sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded-md focus:shadow'
      >
        Hoppa till innehåll
      </a>

      {/* Brand / left panel */}
      <div className='relative flex items-center justify-center bg-brand-primary text-white p-8 md:p-10'>
        {/* Subtle gradient edge (desktop only) */}
        <div
          className='hidden md:block absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-brand-primary pointer-events-none'
          aria-hidden='true'
        />

        {/* Decorative illustration (no alt text for screen readers) */}
        <img
          src={heroSrc}
          alt=''
          aria-hidden='true'
          className='w-[68%] max-w-[520px] h-auto drop-shadow-2xl'
          loading='eager'
          decoding='async'
        />

        {/* Tagline */}
        <div className='absolute left-6 bottom-6 md:left-8 md:bottom-8 text-white/90 text-sm'>
          <p className='font-medium'>Vindra — Från vind till minne.</p>
        </div>
      </div>

      {/* Form / right panel */}
      <div className='flex items-center justify-center p-6 sm:p-8'>
        <main id='main' className='w-full max-w-md'>
          {/* Header with small logomark + product name */}
          <header className='mb-6'>
            <div className='flex items-center gap-3'>
              <span className='inline-flex h-10 w-10 rounded-full bg-brand-primary/10 items-center justify-center ring-1 ring-white/50'>
                {/* Decorative mark */}
                <img
                  src={logoSrc}
                  alt=''
                  aria-hidden='true'
                  className='h-6 w-6'
                />
              </span>
              <h1 className='text-2xl font-semibold tracking-tight text-brand-primary'>
                Vindra
              </h1>
            </div>

            {title && <p className='mt-4 text-xl'>{title}</p>}
            {subtitle && (
              <p className='text-sm text-gray-600 mt-1'>{subtitle}</p>
            )}
          </header>

          {/* Auth card */}
          <section className='bg-white rounded-2xl shadow-soft p-5 md:p-6 border border-brand-border/30'>
            {children}
          </section>

          <p className='mt-6 text-xs text-gray-500'>
            <span className='font-medium text-brand-secondary'>
              Sätt segel. Vi loggar.
            </span>
          </p>
        </main>
      </div>
    </div>
  );
}
