'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Sequential Launch:
 * 1. Initial Opacity Mask covers the screen before preloading (no text, clean minimal aesthetic).
 * 2. On pressing Enter (or clicking the mask), the mask fades out and the Preloader begins.
 * 3. Once preloader completes (100%), the Preloader slides away and the Hero section animates into view.
 * 4. Resets on every browser refresh.
 */
export default function Preloader() {
  const [maskOpen, setMaskOpen] = useState(false);
  const [maskRemoved, setMaskRemoved] = useState(false);
  const [preloaderGone, setPreloaderGone] = useState(false);

  const maskTriggered = useRef(false);
  const pre = useRef(null);
  const g = useRef(null);
  const b = useRef(null);
  const n = useRef(null);

  // Starts the preloader progress animation once the mask is triggered
  const startPreloading = useCallback(() => {
    const R = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MIN = R ? 300 : 2000;
    const MAX = 5000;
    const t0 = performance.now();

    let p = 0;
    let ready = false;
    let raf;
    let alive = true;

    const ok = () => { ready = true; };
    Promise.all([
      document.fonts ? document.fonts.ready : 0,
      new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r))),
    ]).then(ok);
    const mx = setTimeout(ok, MAX);

    const f = (t) => {
      if (!alive) return;
      const el = t - t0;
      const tg = ready && el >= MIN ? 100 : Math.min(90, (el / MIN) * 90);
      p += (tg - p) * 0.1;
      if (tg === 100 && p > 99.4) p = 100;

      if (g.current) g.current.style.setProperty('--p', p + '%');
      if (b.current) b.current.style.width = p + '%';
      if (n.current) n.current.textContent = Math.round(p) + '%';

      if (p < 100) {
        raf = requestAnimationFrame(f);
        return;
      }

      // Preloader reaches 100% -> reveal website and hero section
      setTimeout(() => {
        if (pre.current) pre.current.classList.add('out');
        setTimeout(() => {
          document.documentElement.classList.remove('loading');
          document.body.style.overflow = '';
        }, 350);
        setTimeout(() => setPreloaderGone(true), 1100);
      }, 250);
    };

    raf = requestAnimationFrame(f);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(mx);
    };
  }, []);

  const handleMaskHit = useCallback(() => {
    if (maskTriggered.current) return;
    maskTriggered.current = true;

    // 1. Smoothly fade out the opacity mask
    setMaskOpen(true);
    setTimeout(() => {
      setMaskRemoved(true);
    }, 800);

    // 2. Start the preloader progress animation right after hitting Enter
    startPreloading();
  }, [startPreloading]);

  useEffect(() => {
    // Lock scroll and pause hero animations while mask & preloader are active
    document.documentElement.classList.add('loading');
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (!maskTriggered.current && (e.key === 'Enter' || e.code === 'Enter' || e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        handleMaskHit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleMaskHit]);

  return (
    <>
      {/* Opacity mask: comes before preloading */}
      {!maskRemoved && (
        <div
          id="opacity-mask"
          className={maskOpen ? 'mask-open' : ''}
          onClick={handleMaskHit}
          role="button"
          tabIndex={0}
          aria-label="Enter site"
        >
          <div className="mask-logo-wrap">
            <img
              src="/icon-nobg.png"
              alt="Saaya"
              className="mask-logo"
              onClick={(e) => {
                e.stopPropagation();
                handleMaskHit();
              }}
            />
          </div>
        </div>
      )}

      {/* Preloader: starts after pressing Enter on the mask */}
      {!preloaderGone && (
        <div id="pre" ref={pre} aria-label="Loading">
          <div className="prl">
            <div className="plg" ref={g} />
            <div className="plp"><i ref={b} /></div>
            <span id="pln" ref={n}>0%</span>
            <small>AWH ENGINEERING COLLEGE</small>
          </div>
        </div>
      )}
    </>
  );
}
