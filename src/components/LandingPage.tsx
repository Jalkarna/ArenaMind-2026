import { ArrowRight, Bot, Globe2, Leaf, MapPinned, Radio, ShieldCheck, Users } from 'lucide-react';

interface LandingPageProps { onEnter: (view: 'fan' | 'operator') => void }

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-status"><span /> World Cup 2026 · Venue intelligence</div>
          <h1>One living view of the entire matchday.</h1>
          <p>ArenaMind turns crowd, transit, accessibility, and incident signals into decisions fans and venue teams can act on immediately.</p>
          <div className="landing-actions">
            <button className="landing-primary" onClick={() => onEnter('fan')}>Open fan experience <ArrowRight size={16}/></button>
            <button className="landing-secondary" onClick={() => onEnter('operator')}>Enter operations</button>
          </div>
          <div className="landing-proof"><span><Globe2 size={15}/> 4 languages</span><span><ShieldCheck size={15}/> Human-in-the-loop</span><span><Radio size={15}/> Edge-ready</span></div>
        </div>
        <div className="landing-live-model" aria-label="Live venue preview">
          <div className="model-toolbar"><span>METLIFE / MATCH 42</span><strong>LIVE</strong></div>
          <div className="model-stage">
            <div className="model-ring ring-one"/><div className="model-ring ring-two"/><div className="model-pitch"/>
            <span className="signal signal-a">A <b>5m</b></span><span className="signal signal-c">C <b>35m</b></span><span className="signal signal-d">D <b>45m</b></span><span className="signal signal-e">E <b>8m</b></span>
          </div>
          <div className="model-readout"><div><small>Venue state</small><b>2 zones need attention</b></div><div><small>Recommended action</small><b>Divert arrivals to A + E</b></div></div>
        </div>
      </section>

      <section className="landing-intro">
        <h2>From signal to action, without changing tools.</h2>
        <p>The spatial model stays at the center. Every workflow—from a fan asking for an accessible route to an operator dispatching stewards—uses the same live context.</p>
      </section>

      <section className="capability-grid">
        <article className="capability-map"><MapPinned size={22}/><h3>See pressure where it forms</h3><p>Gate loads, transport status, medical points, and accessible paths are mapped to the place they affect.</p><div className="mini-flow"><span>A</span><span>E</span><i/><span className="hot">C</span><span className="hot">D</span></div></article>
        <article><Bot size={22}/><h3>Ask in plain language</h3><p>A context-aware assistant responds in English, Spanish, French, and Arabic with actions grounded in live venue state.</p></article>
        <article><Users size={22}/><h3>Coordinate the response</h3><p>AI triage drafts a tactical plan, creates a task, and keeps the final operational decision with venue staff.</p></article>
        <article className="capability-green"><Leaf size={22}/><h3>Reward better choices</h3><p>Smart-bin deposits turn sustainability into a visible fan behavior with points and verified carbon savings.</p></article>
      </section>

      <section className="landing-personas">
        <div><span>For fans</span><h2>Get the next best step, not another map.</h2><p>Accessible routes, quieter gates, transit alternatives, food, medical help, and multilingual answers in one place.</p><button onClick={() => onEnter('fan')}>Explore fan hub <ArrowRight size={15}/></button></div>
        <div><span>For venue teams</span><h2>Understand the venue before it becomes an incident.</h2><p>Monitor live flow, triage reports, dispatch volunteers, override gate status, and broadcast in four languages.</p><button onClick={() => onEnter('operator')}>Explore operations <ArrowRight size={15}/></button></div>
      </section>

      <section className="landing-cta"><div><h2>Ready for the next 90 minutes.</h2><p>Explore the complete matchday product with realistic venue context and deterministic offline fallbacks.</p></div><button onClick={() => onEnter('operator')}>Launch command center <ArrowRight size={16}/></button></section>
      <footer className="landing-footer"><strong>ArenaMind</strong><span>FIFA World Cup 2026 concept · Responsible AI · WCAG 2.2 AA</span></footer>
    </div>
  )
}
