import { useEffect, useRef, useState } from 'react';
import { COMPARISON_METHODS, EVIDENCE_COMPONENTS, NAV_ITEMS } from '../content/systemContent';
import './MarketingLanding.css';

const VIDEO_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260809_012548_ef22562c-c0ae-4816-ad9d-f8922af4e6a7.mp4';

const navItems = [{ label: 'Home', path: '/' }, ...NAV_ITEMS];

const stats = [
  { icon: '<', target: EVIDENCE_COMPONENTS.length, suffix: '', decimals: 0, label: 'Evidence Components' },
  { icon: '%', target: COMPARISON_METHODS.length, suffix: '', decimals: 0, label: 'Comparison Methods' },
  { icon: '*', target: 10, suffix: 'MB', decimals: 0, label: 'Report Intake' },
  { icon: '#', target: 0, suffix: '', decimals: 0, label: 'Code Executed' },
];

function route(event, path, onNavigate) {
  event.preventDefault();
  onNavigate(path);
}

function CountUp({ target, suffix, decimals, startDelay }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setValue(target);
      return;
    }

    let frame;
    let timer;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      timer = setTimeout(() => {
        const started = performance.now();
        const duration = 1500 + startDelay * 0.5;
        const tick = now => {
          const progress = Math.min((now - started) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(target * eased);
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      }, startDelay);
    }, { threshold: 0.25 });

    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [startDelay, target]);

  return <strong ref={ref}>{value.toFixed(decimals)}{suffix}</strong>;
}

export default function MarketingLanding({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    const closeOnEscape = event => event.key === 'Escape' && setMenuOpen(false);
    const closeOnDesktop = () => innerWidth > 720 && setMenuOpen(false);
    addEventListener('keydown', closeOnEscape);
    addEventListener('resize', closeOnDesktop);
    return () => {
      document.body.classList.remove('menu-open');
      removeEventListener('keydown', closeOnEscape);
      removeEventListener('resize', closeOnDesktop);
    };
  }, [menuOpen]);

  const navigate = (event, path) => {
    setMenuOpen(false);
    route(event, path, onNavigate);
  };

  return <main className="marketing-page">
    <div className="marketing-bg" aria-hidden="true">
      <video className="marketing-video" autoPlay muted loop playsInline preload="metadata">
        <source src={VIDEO_URL} type="video/mp4" />
      </video>
      <div className="marketing-wash" />
    </div>

    <header className="marketing-header">
      <a className="marketing-logo" href="/" aria-label="Project Similarity home" onClick={event => navigate(event, '/')}>
        <img src="/favicon.svg" width="52" height="52" alt="" />
      </a>
      <nav className="marketing-nav" aria-label="Main navigation">
        {navItems.map((item, index) => <a key={item.path} className={index === 0 ? 'active' : ''} href={item.path} onClick={event => navigate(event, item.path)}>{item.label}</a>)}
      </nav>
      <a className="marketing-launch" href="/analyze" onClick={event => navigate(event, '/analyze')}>Launch app <span>↗</span></a>
      <button className={`marketing-burger ${menuOpen ? 'open' : ''}`} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}><i/><i/><i/></button>
    </header>

    {menuOpen && <div className="marketing-overlay" onClick={() => setMenuOpen(false)}>
      <nav className="marketing-menu" aria-label="Mobile navigation" onClick={event => event.stopPropagation()}>
        {navItems.map((item, index) => <a key={item.path} className={index === 0 ? 'active' : ''} href={item.path} style={{'--i': index}} onClick={event => navigate(event, item.path)}>{item.label}</a>)}
        <a className="mobile-launch" href="/analyze" style={{'--i': 4}} onClick={event => navigate(event, '/analyze')}>Launch analysis <span>↗</span></a>
      </nav>
    </div>}

    <section className="marketing-hero">
      <div className="trust-row anim" style={{'--d': '.05s'}}>
        <div className="trust-avatars" aria-hidden="true">
          <span className="trust-avatar a1"><b>TF</b></span>
          <span className="trust-avatar a2"><b>J</b></span>
          <span className="trust-avatar a3"><b>&lt;/&gt;</b></span>
        </div>
        <span className="trust-pill">Six visible components. One weighted result.</span>
      </div>

      <h1 className="marketing-headline">
        <span>Project Intelligence</span>
        <span>Designed To Explain</span>
      </h1>
      <p className="marketing-subhead anim" style={{'--d': '.28s'}}>Compare project text, reports and source code with historical projects using an explainable multi-signal engine.</p>
      <a className="marketing-cta anim" style={{'--d': '.4s'}} href="/analyze" onClick={event => navigate(event, '/analyze')}>Start an analysis <span>↗</span></a>
    </section>

    <section className="marketing-stats" aria-label="Platform capabilities">
      {stats.map((stat, index) => <article className="marketing-stat anim" style={{'--d': `${0.5 + index * 0.08}s`}} key={stat.label}>
        <span className="stat-icon" aria-hidden="true">{stat.icon}</span>
        <CountUp {...stat} startDelay={480 + index * 90} />
        <small>{stat.label}</small>
      </article>)}
    </section>
  </main>;
}
