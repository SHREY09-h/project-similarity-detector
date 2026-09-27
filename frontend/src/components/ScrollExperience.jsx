import { memo, useEffect, useRef, useState } from 'react';
import {
  ANALYSIS_OPERATIONS,
  COMPARISON_METHODS,
  EVIDENCE_COMPONENTS,
  EXAMPLE_CLASSIFICATION,
  EXAMPLE_COMPONENT_VALUES,
  EXAMPLE_OVERALL_SCORE,
} from '../content/systemContent';
import { angleDistance, clamp, mapScrollToStops } from '../utils/scrollMath';
import './ScrollExperience.css';

const featureStories = [
  {
    number: '01',
    kicker: 'Understand the language',
    title: 'Compare meaning, not only repeated words.',
    copy: 'TF-IDF gives informative terms more weight, while cosine similarity measures how closely titles, summaries and reports relate.',
    signal: COMPARISON_METHODS[0].label,
    visual: 'semantic',
  },
  {
    number: '02',
    kicker: 'Rank repository matches',
    title: 'Apply the same comparison process to every project.',
    copy: 'Keyword overlap, MinHash text shingles and available code evidence help rank the closest historical projects consistently.',
    signal: 'Multi-signal ranking',
    visual: 'retrieval',
  },
  {
    number: '03',
    kicker: 'Review the evidence',
    title: 'See what influenced the result before deciding.',
    copy: 'Six component scores remain visible beside the overall ranking, giving reviewers a clear starting point for closer inspection.',
    signal: 'Explainable result',
    visual: 'evidence',
  },
];

const orbitSignals = ANALYSIS_OPERATIONS;
const wheelSignals = EVIDENCE_COMPONENTS.map(component => ({
  ...component,
  title: component.label,
  copy: component.description,
}));

function useScrollProgress() {
  const sectionRef = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    let lastProgress = -1;
    let isNearViewport = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const measure = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const next = clamp(-rect.top / travel);
      if (Math.abs(next - lastProgress) > 0.00025) {
        lastProgress = next;
        setProgress(next);
      }
    };

    const requestMeasure = () => {
      if (isNearViewport && !frame) frame = window.requestAnimationFrame(measure);
    };

    if (reducedMotion) return undefined;

    const section = sectionRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      isNearViewport = entry.isIntersecting;
      if (isNearViewport) requestMeasure();
    }, { rootMargin: '100% 0px' });
    if (section) observer.observe(section);
    const resizeObserver = new ResizeObserver(requestMeasure);
    if (section) resizeObserver.observe(section);
    measure();
    window.addEventListener('scroll', requestMeasure, { passive: true });
    window.addEventListener('resize', requestMeasure);
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('scroll', requestMeasure);
      window.removeEventListener('resize', requestMeasure);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return [sectionRef, progress];
}

function SemanticVisual() {
  return <div className="story-interface semantic-interface">
    <div className="mini-window-head"><span/><span/><span/><small>project-input.json</small></div>
    <div className="semantic-layout">
      <div className="document-preview">
        <small>SUBMISSION 0248</small>
        <strong>Project similarity<br/>review platform</strong>
        <i/><i/><i/><i className="short"/>
        <div className="document-tags"><span>NLP</span><span>Cosine</span></div>
      </div>
      <div className="semantic-map" aria-hidden="true">
        <span className="map-ring ring-one"/><span className="map-ring ring-two"/>
        <i className="map-node node-one"/><i className="map-node node-two"/><i className="map-node node-three"/>
        <b>84<small>%</small></b><em>semantic similarity</em>
      </div>
    </div>
  </div>;
}

function RetrievalVisual() {
  return <div className="story-interface retrieval-interface">
    <div className="mini-window-head"><span/><span/><span/><small>repository candidates</small></div>
    <div className="retrieval-search"><i>⌕</i><span>Finding related historical projects…</span><b>1,248</b></div>
    <div className="candidate-list">
      {[
        ['PS-0193', 'Student project matching system', 91],
        ['PS-0741', 'Semantic document comparison', 84],
        ['PS-1106', 'Academic source review tool', 76],
      ].map(([id, title, score], index) => <div className={`candidate-row row-${index + 1}`} key={id}>
        <span>{id}</span><p><strong>{title}</strong><small>Combined evidence score</small></p><b>{score}%</b>
      </div>)}
    </div>
    <div className="retrieval-status"><span><i/> ranking ready</span><small>Highest-scoring repository projects shown</small></div>
  </div>;
}

function EvidenceVisual() {
  return <div className="story-interface story-evidence-interface">
    <div className="mini-window-head"><span/><span/><span/><small>comparison evidence</small></div>
    <div className="evidence-summary">
      <div><small>OVERALL SIMILARITY</small><strong>{EXAMPLE_OVERALL_SCORE}%</strong><span>{EXAMPLE_CLASSIFICATION}</span></div>
      <p>Multiple evidence components indicate a related repository project.</p>
    </div>
    <div className="story-score-list">
      {EVIDENCE_COMPONENTS.map(component => {
        const value = EXAMPLE_COMPONENT_VALUES[component.key];
        return <div className="story-score" key={component.key}>
          <div className="story-score-label"><span>{component.label}</span><b>{value}%</b></div><i role="progressbar" aria-label={`${component.label} similarity`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}><em style={{ width: `${value}%` }}/></i>
        </div>;
      })}
    </div>
    <div className="evidence-note"><span>✓</span><p><strong>Evidence ready for review</strong><small>No source code was executed</small></p></div>
  </div>;
}

const FeatureVisual = memo(function FeatureVisual({ type }) {
  if (type === 'semantic') return <SemanticVisual />;
  if (type === 'retrieval') return <RetrievalVisual />;
  return <EvidenceVisual />;
});

function FeatureStory() {
  const [sectionRef, progress] = useScrollProgress();
  const activeIndex = Math.min(featureStories.length - 1, Math.floor(progress * featureStories.length));
  const story = featureStories[activeIndex];
  const rotation = -4 + Math.sin(progress * Math.PI * 2) * 4.5;
  const scale = 0.94 + Math.sin(progress * Math.PI) * 0.045;
  const backgroundShift = (progress - 0.5) * 14;

  return <section className="scroll-story" id="capabilities" ref={sectionRef} style={{ '--story-progress': progress }} aria-label="Scroll-driven comparison feature tour">
    <div className="scroll-story-sticky" style={{ '--section-progress': progress }}>
      <div className="reduced-motion-list">
        <p className="reduced-motion-kicker">Comparison capabilities</p>
        <h2>Three views of the evidence</h2>
        <div>{featureStories.map(item => <article key={item.number}><small>{item.number} · {item.kicker}</small><h3>{item.title}</h3><p>{item.copy}</p></article>)}</div>
      </div>
      <div className="story-outline-copy" aria-hidden="true" style={{ transform: `translate3d(${backgroundShift}vw, -50%, 0)` }}>
        <span>COMPARE</span><span>EXPLAIN</span>
      </div>
      <div className="story-topline"><span>From project input to reviewable evidence</span><b>{String(activeIndex + 1).padStart(2, '0')} / 03</b></div>
      <div className="story-card-wrap" style={{ transform: `translate3d(0, ${Math.sin(progress * Math.PI) * -12}px, 0) rotate(${rotation}deg) scale(${scale})` }}>
        <div className="story-card-glow" aria-hidden="true"/>
        <div className="story-card">
          {featureStories.map((item, index) => <div className={`story-slide ${index === activeIndex ? 'is-active' : ''}`} key={item.number} aria-hidden={index !== activeIndex}>
            <FeatureVisual type={item.visual}/>
          </div>)}
        </div>
        <div className="story-signal-chip"><i/><span>{story.signal}</span></div>
      </div>
      <div className="story-caption" key={story.number}>
        <p className="story-caption-kicker">{story.kicker}</p>
        <h2>{story.title}</h2>
        <p className="story-caption-copy">{story.copy}</p>
      </div>
      <div className="story-progress" aria-hidden="true">
        {featureStories.map((item, index) => <i className={index === activeIndex ? 'is-active' : ''} key={item.number}/>) }
      </div>
      <span className="scroll-experience-status" role="status" aria-live="polite">Feature {activeIndex + 1} of 3: {story.title}</span>
    </div>
  </section>;
}

function SignalOrbit() {
  const [sectionRef, progress] = useScrollProgress();
  const { normalized: motionProgress, position, activeIndex } = mapScrollToStops(progress, orbitSignals.length);
  const stepAngle = 360 / orbitSignals.length;
  const rotation = -position * stepAngle;
  const positions = orbitSignals.map((_, index) => {
    const baseAngle = index * stepAngle;
    return { baseAngle, distance: angleDistance(baseAngle + rotation) };
  });
  const active = orbitSignals[activeIndex];

  return <section className="signal-orbit-section" ref={sectionRef} aria-label="Analysis operation orbit">
    <div className="signal-orbit-sticky" style={{ '--section-progress': progress, '--motion-progress': motionProgress }}>
      <div className="reduced-motion-list">
        <p className="reduced-motion-kicker">How evidence is compared</p>
        <h2>Six transparent analysis operations</h2>
        <div>{orbitSignals.map((signal, index) => <article key={signal.key}><small>OPERATION {String(index + 1).padStart(2, '0')}</small><h3>{signal.label}</h3><p>{signal.detail}</p></article>)}</div>
      </div>
      <div className="orbit-heading">
        <p className="orbit-heading-kicker">Inside the analysis</p>
        <h2>Six clear operations.<br/><em>One transparent comparison.</em></h2>
        <p className="orbit-heading-copy">These operations prepare and compare evidence; they are not hidden extra scores. The final report still presents six weighted evidence components.</p>
      </div>
      <div className="orbit-system" aria-label="Six analysis operations rotating around the comparison process">
        <div className="orbit-rings" aria-hidden="true"><i/><i/><i/></div>
        <div className="signal-orbit" style={{ transform: `rotate(${rotation}deg)` }}>
          {orbitSignals.map((signal, index) => {
            const { baseAngle, distance } = positions[index];
            const clarity = clamp(1 - distance / 90);
            const blur = clamp((distance - 18) / 24, 0, 3.4);
            return <div className={`orbit-node ${index === activeIndex ? 'is-active' : ''}`} key={signal.key} style={{ '--node-angle': `${baseAngle}deg`, '--node-counter': `${-baseAngle}deg` }}>
              <div className="orbit-node-inner" style={{ transform: `rotate(${-rotation}deg) scale(${0.86 + clarity * 0.18})`, filter: `blur(${blur}px)`, opacity: 0.42 + clarity * 0.58 }}>
                <b aria-hidden="true">{signal.short}</b><p><strong>{signal.label}</strong><small>{signal.detail}</small></p>
              </div>
            </div>;
          })}
        </div>
        <div className="orbit-core">
          <small>OPERATION IN FOCUS</small><strong key={active.label}>{active.label}</strong><span>{active.detail}</span>
        </div>
      </div>
      <div className="orbit-footer"><span>Scroll through the analysis operations</span><i>↓</i></div>
      <span className="scroll-experience-status" role="status" aria-live="polite">Operation in focus: {active.label}. {active.detail}</span>
    </div>
  </section>;
}

function AnalysisWheel() {
  const [sectionRef, progress] = useScrollProgress();
  const stepAngle = 32;
  const centerOffset = ((wheelSignals.length - 1) * stepAngle) / 2;
  const baseAngles = wheelSignals.map((_, index) => index * stepAngle - centerOffset);
  const { normalized: motionProgress, position, activeIndex } = mapScrollToStops(progress, wheelSignals.length);
  const rotation = centerOffset - position * stepAngle;
  const positions = baseAngles.map(angle => angleDistance(angle + rotation));
  const active = wheelSignals[activeIndex];

  return <section className="analysis-wheel-section" ref={sectionRef} aria-label="Six weighted similarity evidence components">
    <div className="analysis-wheel-sticky" style={{ '--section-progress': progress, '--wheel-progress': motionProgress }}>
      <div className="reduced-motion-list">
        <p className="reduced-motion-kicker">How the score is built</p>
        <h2>Six weighted evidence components</h2>
        <div>{wheelSignals.map((signal, index) => <article key={signal.title}><small>COMPONENT {String(index + 1).padStart(2, '0')} · {signal.weight}% BASE WEIGHT</small><h3>{signal.title}</h3><p>{signal.copy}</p></article>)}</div>
      </div>
      <div className="wheel-kicker"><div><p>How the score is built</p><h2>Six evidence components</h2></div><b>{String(activeIndex + 1).padStart(2, '0')} / 06</b></div>
      <div className="analysis-wheel-stage">
        <div className="analysis-wheel-disc" style={{ transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}>
          {[-96, -64, -32, 0, 32, 64, 96].map(angle => <i className="wheel-divider" key={angle} style={{ '--divider-angle': `${angle}deg` }}/>) }
          {wheelSignals.map((signal, index) => {
            const totalAngle = baseAngles[index] + rotation;
            const distance = positions[index];
            const prominence = clamp(1 - distance / 82);
            const blur = clamp((distance - 35) / 24, 0, 2.4);
            return <article className={`wheel-item ${index === activeIndex ? 'is-active' : ''}`} aria-current={index === activeIndex ? 'step' : undefined} key={signal.title} style={{ '--wheel-angle': `${baseAngles[index]}deg` }}>
              <div className="wheel-item-inner" style={{ transform: `rotate(${-totalAngle}deg) scale(${0.76 + prominence * 0.28})`, filter: `blur(${blur}px)`, opacity: 0.2 + prominence * 0.8 }}>
                <span aria-hidden="true">{signal.icon}</span><small className="wheel-weight">Base weight · {signal.weight}%</small><h3>{signal.title}</h3><i/><p>{signal.copy}</p>
              </div>
            </article>;
          })}
        </div>
        <div className="wheel-hub">
          <div className="wheel-hub-mark" aria-hidden="true"><i/><i/><i/></div><small>PROJECT SIMILARITY</small><strong>Evidence</strong><span>SIX COMPONENTS · ONE RESULT</span>
        </div>
      </div>
      <div className="wheel-active-copy" key={active.title}>
        <small>COMPONENT {activeIndex + 1} · BASE WEIGHT {active.weight}%</small><strong>{active.title}</strong><p>{active.copy}</p>
      </div>
      <div className="wheel-scroll-rail" aria-hidden="true">{wheelSignals.map((signal, index) => <i className={index === activeIndex ? 'is-active' : ''} key={signal.title}/>)}</div>
      <div className="wheel-scroll-hint" aria-hidden="true"><span>Scroll to rotate</span><i>↓</i></div>
      <span className="scroll-experience-status" role="status" aria-live="polite">Evidence component {activeIndex + 1} of 6: {active.title}, {active.weight}% base weight. {active.copy}</span>
    </div>
  </section>;
}

export default function ScrollExperience() {
  return <>
    <FeatureStory />
    <SignalOrbit />
    <AnalysisWheel />
  </>;
}
