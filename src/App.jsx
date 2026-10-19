import { useEffect, useState, useRef, useCallback, lazy, Suspense } from 'react'
import { detectQuality, hasWebGL } from './scene/quality.js'
import SceneBoundary from './scene/SceneBoundary.jsx'

/* The 3D scene pulls in three.js (~1MB). Load it lazily so the page shell,
   hero copy and navigation paint immediately instead of waiting on it. */
const Scene = lazy(() => import('./scene/Scene.jsx'))
import './App.css'

/* Base-relative asset prefix so the site works when served from a
   subpath (e.g. GitHub Pages at /sobha-3d/) as well as from a domain root. */
const BASE = import.meta.env.BASE_URL

/* ---------- real SOBHA project data (images pulled from sobha.com) ---------- */
const PROJECTS = [
  { slug: 'neopolis', name: 'SOBHA Neopolis', city: 'Bengaluru', config: '3 & 4 Bed Residences', img: `${BASE}projects/neopolis.webp` },
  { slug: 'bellevue', name: 'Bellevue by SOBHA', city: 'Bengaluru', config: '3 & 4 Bed Residences', img: `${BASE}projects/bellevue.webp` },
  { slug: 'woods', name: 'SOBHA Woods', city: 'Bengaluru', config: '4 Bed Residences', img: `${BASE}projects/woods.webp` },
  { slug: 'strada', name: 'SOBHA Strada', city: 'Bengaluru', config: '3 & 4 Bed Residences', img: `${BASE}projects/strada.webp` },
  { slug: 'townpark', name: 'SOBHA Townpark', city: 'Bengaluru', config: '3 & 4 Bed Residences', img: `${BASE}projects/townpark.webp` },
  { slug: 'ayana', name: 'SOBHA Ayana', city: 'Bengaluru', config: '3 & 4 Bed Residences', img: `${BASE}projects/ayana.webp` },
  { slug: 'infinia', name: 'SOBHA Infinia', city: 'Bengaluru', config: '3 Bed Residences', img: `${BASE}projects/infinia.webp` },
  { slug: 'elysia', name: 'SOBHA Elysia', city: 'GIFT City', config: '4 Bed Residences', img: `${BASE}projects/elysia.webp` },
  { slug: 'aranya', name: 'SOBHA Aranya', city: 'Greater Noida', config: '4 & 5 Bed Residences', img: `${BASE}projects/aranya.webp` },
  { slug: 'nesara', name: 'SOBHA Nesara', city: 'Pune', config: '3 & 4 Bed Residences', img: `${BASE}projects/nesara.webp` },
  { slug: 'altus', name: 'SOBHA Altus', city: 'Gurugram', config: '3 & 4 Bed Residences', img: `${BASE}projects/altus.webp` },
  { slug: 'atlantis', name: 'SOBHA Atlantis', city: 'Bengaluru', config: '3 & 4 Bed Residences', img: `${BASE}projects/atlantis.webp` },
  { slug: 'arbor', name: 'SOBHA Arbor', city: 'Chennai', config: '3 & 4 Bed Residences', img: `${BASE}projects/arbor.webp` },
  { slug: 'insignia', name: 'SOBHA Insignia', city: 'Bengaluru', config: '3 & 4 Bed Residences', img: `${BASE}projects/insignia.webp` },
  { slug: 'royalcrest', name: 'Sobha Royal Crest', city: 'Thrissur', config: '3 & 4 Bed Residences', img: `${BASE}projects/royalcrest.webp` },
]

const CITIES = [
  'Bengaluru', 'Chennai', 'Coimbatore', 'GIFT City Gandhinagar', 'Greater Noida',
  'Gurugram', 'Hyderabad', 'Kochi', 'Kozhikode', 'Mumbai', 'Mysuru', 'Pune',
  'Thiruvananthapuram', 'Thrissur',
]

const NAV = [
  { label: 'Who We Are', id: 'philosophy' },
  { label: 'What We Do', id: 'projects' },
  { label: 'Showcase', id: 'legacy' },
  { label: 'Contact', id: 'contact' },
]

/* ------------------------------------------------------------------ */
function Nav() {
  return (
    <header className="nav">
      <a className="brand" href="#top">
        <span className="brand-mark">S</span>
        <span className="brand-word">SOBHA</span>
      </a>
      <nav className="nav-links">
        {NAV.map((n) => (
          <a key={n.id} href={`#${n.id}`}>
            {n.label}
          </a>
        ))}
      </nav>
      <a className="nav-cta" href="#contact">
        Find Your Dream Home
      </a>
    </header>
  )
}

function Hero({ innerRef }) {
  return (
    <section className="hero" id="top" ref={innerRef}>
      <div className="hero-inner">
        <p className="kicker">Since 1995 · Bengaluru</p>
        <h1 className="hero-title">
          Find Your Next
          <br />
          <span className="grad">Dream Home</span>
        </h1>
        <p className="hero-sub">
          Thirty years of backward integration, in-house manufacturing and
          uncompromising craftsmanship — redefined in three dimensions.
        </p>
        <div className="hero-actions">
          <a className="btn primary" href="#projects">
            Explore residences
          </a>
          <a className="btn ghost" href="#philosophy">
            Passion at work
          </a>
        </div>
      </div>
      <div className="scroll-hint">
        <span className="mouse">
          <span className="wheel" />
        </span>
        Scroll to explore
      </div>
    </section>
  )
}

function ProjectsSection({ index, setIndex, innerRef }) {
  const i = index
  const p = PROJECTS[i]
  const next = () => setIndex((i + 1) % PROJECTS.length)
  const prev = () => setIndex((i - 1 + PROJECTS.length) % PROJECTS.length)
  return (
    <section className="section section-left" id="projects" ref={innerRef}>
      <div className="panel">
        <p className="kicker">01 — Residential</p>
        <h2>Iconic developments</h2>
        <p className="panel-body">
          From Bengaluru skylines to the GIFT City waterfront — drag the ring of
          towers and pick a residence.
        </p>
        <div className="project-card">
          <div className="project-meta">
            <h3>{p.name}</h3>
            <p className="project-sub">
              {p.city} · {p.config}
            </p>
          </div>
          <div className="project-controls">
            <button className="round" onClick={prev} aria-label="Previous project">
              ←
            </button>
            <span className="project-count">
              {String(i + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
            </span>
            <button className="round" onClick={next} aria-label="Next project">
              →
            </button>
          </div>
        </div>
        <div className="city-chips">
          {CITIES.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function PhilosophySection({ innerRef }) {
  return (
    <section className="section section-right" id="philosophy" ref={innerRef}>
      <div className="panel">
        <p className="kicker">02 — Philosophy</p>
        <h2>Passion at work</h2>
        <p className="panel-body">
          SOBHA’s penchant for perfection is reflected in every project, every
          decision and every innovation. This underlies our quest to deliver
          world-class quality and impeccable craftsmanship.
        </p>
        <p className="panel-body">
          Our founder, Mr. PNC Menon, instilled in us this passion that transcends
          generations — a commitment to never compromise on quality that
          revolutionised the way the world perceives luxury in real estate.
        </p>
        <ul className="stat-list">
          <li>
            <strong>14,700+</strong>
            <span>Homes delivered</span>
          </li>
          <li>
            <strong>154.23M</strong>
            <span>Sq. ft. developed</span>
          </li>
          <li>
            <strong>55,000</strong>
            <span>Sq. m. of manufacturing</span>
          </li>
        </ul>
        <a className="btn primary" href="https://www.sobha.com/philosophy/" target="_blank" rel="noreferrer">
          Read our philosophy
        </a>
      </div>
    </section>
  )
}

function LegacySection({ innerRef }) {
  const MILESTONES = [
    { y: '1995', t: 'SOBHA Limited incorporated on August 7th, 1995' },
    { y: '1997', t: 'First residential project — SOBHA Sapphire, Bengaluru' },
    { y: '1998', t: 'First Indian real estate company with ISO 9001 certification' },
    { y: '2006', t: "Kerala's first integrated township — SOBHA City, Thrissur" },
    { y: '2012', t: 'Honoured as a Global Growth Company by the World Economic Forum' },
    { y: '2015', t: 'Enters retail with SOBHA City Mall, Thrissur' },
    { y: '2016', t: 'Enters Hyderabad & Thiruvananthapuram' },
    { y: '2025', t: 'Real Estate Developer of the Year — Residential, Times Conclave' },
  ]
  return (
    <section className="section section-left" id="legacy" ref={innerRef}>
      <div className="panel">
        <p className="kicker">03 — Showcase</p>
        <h2>The SOBHA journey</h2>
        <p className="panel-body">
          From a single project in Bengaluru to a pan-India portfolio of
          award-winning, iconic developments.
        </p>
        <ol className="timeline">
          {MILESTONES.map((m) => (
            <li key={m.y}>
              <span className="tl-year">{m.y}</span>
              <span className="tl-text">{m.t}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ContactSection({ innerRef }) {
  const [sent, setSent] = useState(false)
  return (
    <section className="section section-right" id="contact" ref={innerRef}>
      <div className="panel">
        <p className="kicker">04 — Contact</p>
        <h2>Let’s build your address</h2>
        <p className="panel-body">
          Talk to our sales team about a residence, or explore business
          opportunities across 14 cities.
        </p>
        <form
          className="contact-form"
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
        >
          <input type="text" name="name" placeholder="Your name" required />
          <input type="email" name="email" placeholder="Email" required />
          <select name="city" defaultValue="Bengaluru">
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <textarea name="msg" placeholder="Tell us what you're looking for" rows={3} />
          <button className="btn primary" type="submit">
            {sent ? 'Message sent ✓' : 'Enquire now'}
          </button>
        </form>
        <p className="help">
          Or call <a href="tel:08046464500">080 46464500</a> · Mon–Sat, 9am–6pm
        </p>
      </div>
    </section>
  )
}

const YEAR = new Date().getFullYear()

function Footer() {
  return (
    <footer className="footer">
      <span>© {YEAR} SOBHA Limited</span>
      <span>CIN: L45201KA1995PLC018475</span>
      <div className="footer-links">
        <a href="https://www.sobha.com/blog/">Blog</a>
        <a href="https://www.sobha.com/careers/">Careers</a>
        <a href="https://www.sobha.com/sustainability/">Sustainability</a>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ */
export default function App() {
  const [station, setStation] = useState(0)
  const [frac, setFrac] = useState(0)
  // detected once, synchronously, so the 3D renderer is never rebuilt
  const [quality] = useState(detectQuality)
  // no WebGL => never download the 1MB 3D bundle at all
  const [webgl] = useState(hasWebGL)
  const [activeProject, setActiveProject] = useState(0)
  const sectionRefs = useRef([])

  /* Map scroll position onto the scene's stations using the real measured
     section offsets — sections are not exactly 100vh tall, so a naive
     scrollY / vh mapping drifts and the camera lands between scenes. */
  const onScroll = useCallback(() => {
    const y = window.scrollY
    const vh = window.innerHeight
    const els = sectionRefs.current.filter(Boolean)
    if (!els.length) return

    let idx = 0
    for (let i = 0; i < els.length; i++) {
      if (y + vh * 0.5 >= els[i].offsetTop) idx = i
    }
    const start = els[idx].offsetTop
    const end = idx + 1 < els.length ? els[idx + 1].offsetTop : start + vh
    const f = Math.max(0, Math.min(1, (y - start) / Math.max(1, end - start)))
    setStation((prev) => (prev === idx ? prev : idx))
    setFrac((prev) => (Math.abs(prev - f) < 0.002 ? prev : f))
  }, [])

  const registerSection = useCallback(
    (i) => (el) => {
      sectionRefs.current[i] = el
    },
    [],
  )

  useEffect(() => {
    onScroll()
    // Throttle with rAF: a scroll event fires on every pixel of travel, and
    // each one triggers a React re-render of the whole scene tree. Coalescing
    // to one update per frame is what keeps scrolling smooth.
    let queued = false
    const onScrollRaf = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(() => {
        queued = false
        onScroll()
      })
    }
    window.addEventListener('scroll', onScrollRaf, { passive: true })
    window.addEventListener('resize', onScrollRaf)
    return () => {
      window.removeEventListener('scroll', onScrollRaf)
      window.removeEventListener('resize', onScrollRaf)
    }
  }, [onScroll])

  return (
    <div className="app">
      {/* The 3D layer is strictly additive. If WebGL is missing, the chunk
          fails to load, or the driver resets, the page keeps all of its
          content and drops only the 3D backdrop. */}
      {webgl ? (
        <SceneBoundary
          fallback={<div className="stage stage-fallback" aria-hidden="true" />}
        >
          <Suspense fallback={<div className="stage stage-loading" aria-hidden="true" />}>
            <Scene
              station={station}
              frac={frac}
              projects={PROJECTS}
              quality={quality}
              activeProject={activeProject}
              onSelectProject={setActiveProject}
            />
          </Suspense>
        </SceneBoundary>
      ) : (
        <div className="stage stage-fallback" aria-hidden="true" />
      )}
      <Nav />
      <main>
        <Hero innerRef={registerSection(0)} />
        <ProjectsSection index={activeProject} setIndex={setActiveProject} innerRef={registerSection(1)} />
        <PhilosophySection innerRef={registerSection(2)} />
        <LegacySection innerRef={registerSection(3)} />
        <ContactSection innerRef={registerSection(4)} />
      </main>
      <Footer />
    </div>
  )
}
