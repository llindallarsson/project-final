import { useEffect, useRef, useState } from 'react';
import hero from '@/assets/log-in-hero.png';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export default function AuthLayout({ title, subtitle, children, heroSrc = hero }) {
  const [showSplash, setShowSplash] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const hadSplashRef = useRef(false); // spåra om splash har visats en gång

  // Visa splash endast på mobil/tablet, och hantera resize/rotation.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mqDesktop = window.matchMedia('(min-width:1024px)'); // lg
    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DELAY = prefersReduce ? 0 : 2200;
    const FADE = prefersReduce ? 0 : 300;

    const startSplashIfNeeded = () => {
      if (mqDesktop.matches) {
        // Desktop: ingen splash
        setShowSplash(false);
        setFadeOut(false);
        return;
      }
      // Mobil/tablet: visa splash med fade
      setShowSplash(true);
      hadSplashRef.current = true;

      const t1 = setTimeout(() => setFadeOut(true), DELAY);
      const t2 = setTimeout(() => setShowSplash(false), DELAY + FADE);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    };

    // Kör vid mount
    const cleanup = startSplashIfNeeded();

    // Om du ändrar fönsterbredd till desktop medan splash visas: stäng den
    const onResize = () => {
      if (mqDesktop.matches) {
        setShowSplash(false);
        setFadeOut(false);
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  // Lås body-scroll när splash visas
  useEffect(() => {
    if (!showSplash) {
      document.body.classList.remove('overflow-hidden');
      return;
    }
    document.body.classList.add('overflow-hidden');
    return () => document.body.classList.remove('overflow-hidden');
  }, [showSplash]);

  // När splashen har visats och försvunnit: lägg fokus snyggt.
  // (Gör det bara om splash faktiskt visades; aldrig på desktop initialt.)
  useEffect(() => {
    if (showSplash) return;
    if (!hadSplashRef.current) return;

    const target =
      document.querySelector('[data-initial-focus]') || document.querySelector('input[autofocus]');
    if (target instanceof HTMLElement) {
      target.focus({ preventScroll: true });
      return;
    }
    const main = document.getElementById('main');
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
      // ta bort tabindex efter fokus så main inte är tabbbar framöver
      const remove = () => main.removeAttribute('tabindex');
      main.addEventListener('blur', remove, { once: true });
    }
  }, [showSplash]);

  return (
    <div className="min-h-screen bg-brand-surface-100 font-ui lg:grid lg:grid-cols-2">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:text-black focus:px-3 focus:py-2 focus:rounded-md focus:shadow"
      >
        Hoppa till innehåll
      </a>

      {/* MOBIL/TABLET SPLASH (fade overlay) */}
      {showSplash && (
        <div
          aria-hidden="true"
          className={[
            'fixed inset-0 z-50 flex items-center justify-center overflow-hidden',
            'bg-brand-primary text-white p-8 lg:hidden',
            'transition-opacity duration-300 ease-out',
            fadeOut ? 'opacity-0' : 'opacity-100',
          ].join(' ')}
        >
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="h-[clamp(240px,65vmin,440px)] w-[clamp(240px,65vmin,440px)] rounded-full bg-brand-accent" />
          </div>
          <img
            src={heroSrc}
            alt=""
            className="relative z-10 h-auto w-[78%] max-w-[560px] drop-shadow-2xl"
            loading="eager"
            decoding="async"
          />
        </div>
      )}

      {/* DESKTOP VÄNSTERPANEL */}
      <div className="relative hidden overflow-hidden bg-brand-primary p-8 text-white md:p-10 lg:flex lg:items-center lg:justify-center">
        <div
          className="pointer-events-none absolute inset-0 grid place-items-center"
          aria-hidden="true"
        >
          <div className="h-[min(60vmin,440px)] w-[min(60vmin,440px)] rounded-full bg-brand-accent" />
        </div>
        <div
          className="absolute inset-y-0 right-0 hidden w-24 bg-gradient-to-r from-transparent to-brand-primary pointer-events-none md:block"
          aria-hidden="true"
        />
        <img
          src={heroSrc}
          alt=""
          className="relative z-10 h-auto w-[68%] max-w-[520px] drop-shadow-2xl"
          loading="eager"
          decoding="async"
        />
      </div>

      {/* FORM (gör inaktiv medan splash visas) */}
      <div
        className="flex items-center justify-center p-6 sm:p-8"
        aria-hidden={showSplash ? 'true' : undefined}
        aria-busy={showSplash ? 'true' : undefined}
        {...(showSplash ? { inert: '' } : {})}
      >
        <main id="main" className="w-full max-w-md focus:outline-none focus-visible:outline-none">
          <header className="mb-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-primary">
              Vindra.
            </h1>
            <p className="mt-3 text-sm text-gray-900">
              <span className="font-medium">
                <b>Från vind till minne.</b> Logga din segling med karta, vind, besättning och
                foton.
              </span>
            </p>
          </header>

          <Card radius="2xl" variant="elevated" className="border border-brand-border/30">
            {(title || subtitle) && <CardHeader padding="lg" title={title} subtitle={subtitle} />}
            <CardContent padding="lg">{children}</CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
