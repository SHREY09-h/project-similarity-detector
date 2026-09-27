import { useState, useEffect } from 'react';
import FluidBackground from './FluidBackground';
import {
  EVIDENCE_COMPONENTS,
  PRODUCT,
  NAV_ITEMS,
  COMPARISON_METHODS,
  ANALYSIS_OPERATIONS,
  WORKFLOW_STEPS
} from '../content/systemContent';
import { api } from '../services/api';
import './ServiceLanding.css';

function navigate(event, path, onNavigate) {
  event.preventDefault();
  onNavigate(path);
}

const SAMPLE_COMPARISONS = [
  {
    name: 'AI Attendance vs Face Recognition',
    projA: 'AI-Based Student Attendance Management System',
    projB: 'Automated Face Recognition Attendance Portal',
    category: 'Computer Vision / AI',
    overall: 87,
    classification: 'Very High Similarity',
    guidance: 'Many available evidence components are closely aligned. Prioritize a detailed manual review.',
    components: {
      title: 72,
      abstract: 91,
      report: 85,
      keywords: 88,
      minhash: 83,
      code: 84
    },
    evidence: [
      'High semantic alignment in facial embedding and webcam capture modules.',
      'Shared architecture: Haar Cascade / MTCNN detection + SQLite attendance log.',
      'Identical keyword intersections across 6 core technical concepts.'
    ]
  },
  {
    name: 'Hospital Booking vs Doctor Portal',
    projA: 'Online Hospital Bed & Appointment System',
    projB: 'Smart Doctor Scheduling & Clinic Portal',
    category: 'Web Development',
    overall: 74,
    classification: 'High Similarity',
    guidance: 'Several evidence components are closely aligned. Review the project context and component evidence.',
    components: {
      title: 64,
      abstract: 82,
      report: 76,
      keywords: 78,
      minhash: 68,
      code: 71
    },
    evidence: [
      'Similar database relational schema for patients, doctors, and appointment slots.',
      'Shared REST endpoint workflows for booking reservation and email notification.'
    ]
  },
  {
    name: 'E-Commerce vs Blockchain Supply Chain',
    projA: 'Full-Stack E-Commerce Retail Storefront',
    projB: 'Decentralized Blockchain Supply Chain Ledger',
    category: 'Software Engineering',
    overall: 19,
    classification: 'Low Similarity',
    guidance: 'Limited alignment was found in the available evidence. This does not prove originality.',
    components: {
      title: 15,
      abstract: 22,
      report: 18,
      keywords: 20,
      minhash: 14,
      code: 24
    },
    evidence: [
      'Different core algorithmic paradigms (Centralized SQL vs Smart Contracts).',
      'Distinct domain terminology with negligible shingle overlap.'
    ]
  }
];

export default function ServiceLanding({ onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [selectedDemo, setSelectedDemo] = useState(0);

  useEffect(() => {
    let active = true;
    api.projects()
      .then(data => {
        if (active && Array.isArray(data)) {
          setProjects(data.slice(0, 4));
        }
      })
      .catch(err => {
        console.error('Failed to fetch projects', err);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const revealItems = document.querySelectorAll('.ps-landing .scroll-reveal');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) {
      revealItems.forEach(item => item.classList.add('is-visible'));
      return undefined;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach(item => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const demo = SAMPLE_COMPARISONS[selectedDemo];

  return (
    <main className="ps-landing">
      {/* WebGL Ambient Motion Canvas */}
      <FluidBackground />
      <div className="ps-landing-scrim" aria-hidden="true" />

      {/* Floating Header */}
      <header className="ps-hero-nav">
        <a className="ps-brand" href="/" onClick={e => navigate(e, '/', onNavigate)} aria-label="Project Similarity home">
          <div className="ps-brand-symbol">
            <span>PS</span>
          </div>
          <div className="ps-brand-text">
            <strong>Project Similarity</strong>
            <small>Academic Integrity Hub</small>
          </div>
        </a>

        <nav className="ps-nav-menu" aria-label="Main navigation">
          {NAV_ITEMS.map(item => (
            <a key={item.path} href={item.path} onClick={e => navigate(e, item.path, onNavigate)}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ps-nav-actions">
          <div className="ps-engine-status" title="FastAPI Similarity Engine is active">
            <span className="ps-status-pulse" />
            <small>Engine Online</small>
          </div>
          <a className="ps-btn ps-btn-glow" href="/analyze" onClick={e => navigate(e, '/analyze', onNavigate)}>
            Start comparison <span>→</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="ps-hero-section">
        <div className="ps-hero-center">
          <div className="ps-hero-badge">
            <span className="ps-badge-star">✦</span>
            <span>MULTI-DIMENSIONAL ACADEMIC INTEGRITY & SIMILARITY ENGINE</span>
          </div>

          <h1 className="ps-hero-title">
            <span>Deep Project Intelligence.</span>
            <span className="ps-gradient-text">Preserving Originality.</span>
          </h1>

          <p className="ps-hero-subtitle">
            Academic Integrity Hub · Find related projects.
          </p>

          <p className="ps-hero-description">
            An explainable decision-support platform that evaluates project titles, semantic abstracts, documentation reports, and normalized source code across historical college repositories.
          </p>

          <div className="ps-hero-actions">
            <a className="ps-btn ps-btn-primary ps-btn-large" href="/analyze" onClick={e => navigate(e, '/analyze', onNavigate)}>
              <span>Launch Project Analysis</span>
              <i className="ps-arrow">↗</i>
            </a>
            <a className="ps-btn ps-btn-glass ps-btn-large" href="/projects" onClick={e => navigate(e, '/projects', onNavigate)}>
              <span>Browse Repository</span>
              <small className="ps-badge-count">{projects.length ? `${projects.length}+ projects` : '10 projects'}</small>
            </a>
            <a className="ps-btn ps-btn-ghost" href="#simulator">
              <span>Try Live Simulator</span>
              <span className="ps-cue-down">↓</span>
            </a>
          </div>

          {/* Key Metric Highlights */}
          <div className="ps-hero-metrics">
            <div className="ps-metric-item">
              <strong>6</strong>
              <span>Independent Evidence Signals</span>
            </div>
            <div className="ps-metric-divider" />
            <div className="ps-metric-item">
              <strong>4</strong>
              <span>NLP & AST Algorithms</span>
            </div>
            <div className="ps-metric-divider" />
            <div className="ps-metric-item">
              <strong>100%</strong>
              <span>Explainable Decision Support</span>
            </div>
            <div className="ps-metric-divider" />
            <div className="ps-metric-item">
              <strong>0%</strong>
              <span>Code Execution Risk</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Simulator Section */}
      <section className="ps-section ps-simulator-section scroll-reveal" id="simulator">
        <div className="ps-section-head text-center">
          <p className="ps-eyebrow">INTERACTIVE SIMULATION ENGINE</p>
          <h2>Experience Explainable Similarity in Action</h2>
          <p className="ps-section-lede">
            Explore how the system calculates multi-level similarity across two projects without black-box conclusions.
          </p>
        </div>

        <div className="ps-simulator-container">
          {/* Demo Scenario Selector Tabs */}
          <div className="ps-demo-tabs" role="tablist">
            {SAMPLE_COMPARISONS.map((item, idx) => (
              <button
                key={item.name}
                type="button"
                role="tab"
                aria-selected={selectedDemo === idx}
                className={`ps-demo-tab ${selectedDemo === idx ? 'active' : ''}`}
                onClick={() => setSelectedDemo(idx)}
              >
                <span className="ps-tab-index">0{idx + 1}</span>
                <span className="ps-tab-label">{item.name}</span>
                <b className={`ps-score-pill score-${Math.floor(item.overall / 20)}`}>{item.overall}%</b>
              </button>
            ))}
          </div>

          {/* Interactive Simulation Dashboard Card */}
          <div className="ps-simulator-card">
            {/* Top Comparative Header */}
            <div className="ps-sim-header">
              <div className="ps-sim-proj">
                <small>SUBMITTED PROJECT A</small>
                <h3>{demo.projA}</h3>
                <span className="ps-tag">{demo.category}</span>
              </div>

              <div className="ps-sim-vs">
                <div className="ps-vs-circle">VS</div>
                <div className="ps-overall-badge">
                  <strong>{demo.overall}%</strong>
                  <small>{demo.classification}</small>
                </div>
              </div>

              <div className="ps-sim-proj text-right">
                <small>HISTORICAL REPOSITORY CANDIDATE B</small>
                <h3>{demo.projB}</h3>
                <span className="ps-tag">{demo.category}</span>
              </div>
            </div>

            {/* Principle Callout */}
            <div className="ps-sim-guidance">
              <span className="ps-guidance-icon">ℹ</span>
              <div>
                <strong>Faculty Decision Support Principle:</strong>
                <p>{demo.guidance} The overall score is a weighted composite of 6 transparent dimensions.</p>
              </div>
            </div>

            {/* 6-Signal Live Meters Grid */}
            <div className="ps-sim-meters-grid">
              {EVIDENCE_COMPONENTS.map(component => {
                const value = demo.components[component.key];
                return (
                  <div className="ps-sim-meter-card" key={component.key}>
                    <div className="ps-meter-top">
                      <div className="ps-meter-info">
                        <span className="ps-meter-icon">{component.icon}</span>
                        <div>
                          <b>{component.label}</b>
                          <small>{component.method} · {component.weight}% base weight</small>
                        </div>
                      </div>
                      <strong className="ps-meter-value">{value}%</strong>
                    </div>

                    <div className="ps-progress-track">
                      <div
                        className="ps-progress-bar"
                        style={{
                          width: `${value}%`,
                          background: value >= 80 ? 'linear-gradient(90deg, #ff7a6b, #ffb36b)' :
                                      value >= 50 ? 'linear-gradient(90deg, #ffc36b, #a995ff)' :
                                                    'linear-gradient(90deg, #65d8ff, #a995ff)'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Evidence Findings */}
            <div className="ps-sim-evidence-trail">
              <h4>Generated Evidence Trail:</h4>
              <ul>
                {demo.evidence.map((point, i) => (
                  <li key={i}>
                    <span className="ps-bullet">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ps-sim-footer">
              <p>Uploaded student source code and report documents are read as static text tokens and are never compiled or executed.</p>
              <a href="/analyze" className="ps-btn ps-btn-primary" onClick={e => navigate(e, '/analyze', onNavigate)}>
                Run Real Analysis with Your Files →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Showcase */}
      <section className="ps-section ps-capabilities-section scroll-reveal">
        <div className="ps-section-head text-center">
          <p className="ps-eyebrow">CORE PLATFORM CAPABILITIES</p>
          <h2>Three Pillars of Explainable Intelligence</h2>
          <p className="ps-section-lede">
            Built from mathematical information retrieval principles to provide repeatable, evidence-backed evaluation.
          </p>
        </div>

        <div className="ps-capabilities-grid">
          <div className="ps-cap-card">
            <div className="ps-cap-num">01</div>
            <h3>Understand the Language</h3>
            <p>
              TF-IDF gives informative domain vocabulary more weight, while cosine similarity measures semantic closeness across titles, abstracts, and reports.
            </p>
            <span className="ps-cap-tag">TF-IDF + Cosine Similarity</span>
          </div>

          <div className="ps-cap-card">
            <div className="ps-cap-num">02</div>
            <h3>Multi-Signal Ranking</h3>
            <p>
              Keyword Jaccard overlap, MinHash 3-word shingles, and normalized source tokens rank repository candidates consistently.
            </p>
            <span className="ps-cap-tag">MinHash & Jaccard Shingling</span>
          </div>

          <div className="ps-cap-card">
            <div className="ps-cap-num">03</div>
            <h3>Review the Evidence Trail</h3>
            <p>
              Six component scores remain visible alongside the overall rating, giving faculty reviewers a clear starting point for academic review.
            </p>
            <span className="ps-cap-tag">Explainable Breakdown</span>
          </div>
        </div>
      </section>

      {/* 6 Analysis Operations Grid */}
      <section className="ps-section ps-operations-section scroll-reveal">
        <div className="ps-section-head text-center">
          <p className="ps-eyebrow">INSIDE THE SIMILARITY ENGINE</p>
          <h2>Six Transparent Operations</h2>
          <p className="ps-section-lede">
            Every submission undergoes standardized static preprocessing before vector comparison.
          </p>
        </div>

        <div className="ps-operations-grid">
          {ANALYSIS_OPERATIONS.map((op, index) => (
            <div className="ps-op-card" key={op.key}>
              <div className="ps-op-head">
                <span className="ps-op-tag">{op.short}</span>
                <span className="ps-op-idx">OP 0{index + 1}</span>
              </div>
              <h4>{op.label}</h4>
              <p>{op.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Repository Highlights */}
      <section className="ps-section ps-repository-section scroll-reveal">
        <div className="ps-section-head text-center">
          <p className="ps-eyebrow">HISTORICAL REPOSITORY RECORDS</p>
          <h2>Pre-Indexed Student & Research Projects</h2>
          <p className="ps-section-lede">
            Each submission is evaluated against pre-processed metadata, abstract embeddings, and normalized code tokens.
          </p>
        </div>

        <div className="ps-repo-grid">
          {projects.map(item => (
            <article className="ps-repo-card" key={item.id}>
              <div className="ps-repo-card-head">
                <span className="ps-repo-cat">{item.category}</span>
                <span className="ps-repo-year">{item.academic_year || 'Academic Record'}</span>
              </div>
              <h3>
                <a href={`/projects/${item.id}`} onClick={e => navigate(e, `/projects/${item.id}`, onNavigate)}>
                  {item.title}
                </a>
              </h3>
              <p className="ps-repo-abstract">{item.abstract}</p>
              <div className="ps-repo-card-foot">
                <small>Team: {item.team_name || 'Academic Project Group'}</small>
                <a href={`/projects/${item.id}`} className="ps-link-arrow" onClick={e => navigate(e, `/projects/${item.id}`, onNavigate)}>
                  View Record →
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center" style={{ marginTop: '3rem' }}>
          <a href="/projects" className="ps-btn ps-btn-glass ps-btn-large" onClick={e => navigate(e, '/projects', onNavigate)}>
            Browse Full Project Archive →
          </a>
        </div>
      </section>

      {/* Decision Support vs Black Box Comparison */}
      <section className="ps-section ps-comparison-philosophy scroll-reveal">
        <div className="ps-section-head text-center">
          <p className="ps-eyebrow">ACADEMIC DECISION SUPPORT PHILOSOPHY</p>
          <h2>Why Explainable Signals Outperform Generic Plagiarism Checkers</h2>
        </div>

        <div className="ps-philosophy-grid">
          <div className="ps-philosophy-card bad-practice">
            <div className="ps-card-badge">TRADITIONAL PLAGIARISM CHECKER</div>
            <h3>Simplistic & Accusatory</h3>
            <ul>
              <li>❌ Outputs a single reductive label: <em>"87% Plagiarized"</em>.</li>
              <li>❌ Treats missing files as false zero scores.</li>
              <li>❌ Confuses standard framework syntax and boilerplate with misconduct.</li>
              <li>❌ Black-box percentage with zero explanation of structural similarities.</li>
              <li>❌ Profiles and ranks students rather than comparing project artifacts.</li>
            </ul>
          </div>

          <div className="ps-philosophy-card good-practice">
            <div className="ps-card-badge">PROJECT SIMILARITY DETECTION SYSTEM</div>
            <h3>Explainable Decision Support</h3>
            <ul>
              <li>✅ Multi-level score breakdown across 6 transparent dimensions.</li>
              <li>✅ Dynamically redistributes weights when optional source code/report is omitted.</li>
              <li>✅ Distinguishes between shared domain terminology and structural code logic.</li>
              <li>✅ Surfaces an audit-ready evidence trail with matching topics & code patterns.</li>
              <li>✅ Empowers faculty to make the final informed academic review decision.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5-Step Workflow */}
      <section className="ps-section ps-workflow-section scroll-reveal">
        <div className="ps-section-head text-center">
          <p className="ps-eyebrow">STANDARDIZED WORKFLOW</p>
          <h2>From Project Submission to Verified Evidence Report</h2>
        </div>

        <div className="ps-workflow-timeline">
          {WORKFLOW_STEPS.map(step => (
            <div className="ps-workflow-node" key={step.number}>
              <div className="ps-node-circle">{step.number}</div>
              <div className="ps-node-content">
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* High-Impact CTA Section */}
      <section className="ps-final-cta-section scroll-reveal">
        <div className="ps-final-cta-card">
          <div className="ps-cta-glow" aria-hidden="true" />
          <p className="ps-eyebrow">READY TO EVALUATE?</p>
          <h2>Put Evidence Before Assumptions.</h2>
          <p className="ps-cta-desc">
            Compare student group projects, academic capstones, and software repositories with transparent multi-signal intelligence.
          </p>
          <div className="ps-cta-actions">
            <a className="ps-btn ps-btn-primary ps-btn-large" href="/analyze" onClick={e => navigate(e, '/analyze', onNavigate)}>
              Start Project Analysis ↗
            </a>
            <a className="ps-btn ps-btn-glass ps-btn-large" href="/how-it-works" onClick={e => navigate(e, '/how-it-works', onNavigate)}>
              Review Algorithm Documentation →
            </a>
          </div>
        </div>
      </section>

      {/* Common Footer */}
      <footer className="ps-site-footer scroll-reveal">
        <div className="ps-footer-grid">
          <div className="ps-footer-brand">
            <div className="ps-brand-symbol">
              <span>PS</span>
            </div>
            <strong>Project Similarity Detection System</strong>
            <p>
              University SGP Academic Integrity Hub. Transparent, multi-signal decision support for faculty reviews.
            </p>
            <small>{PRODUCT.safetyStatement}</small>
          </div>

          <div className="ps-footer-col">
            <h5>Navigation</h5>
            <ul>
              {NAV_ITEMS.map(item => (
                <li key={item.path}>
                  <a href={item.path} onClick={e => navigate(e, item.path, onNavigate)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="ps-footer-col">
            <h5>Comparison Methods</h5>
            <ul>
              {COMPARISON_METHODS.map(method => (
                <li key={method.key}>
                  <span className="ps-method-tag">{method.short}</span>
                  <span>{method.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="ps-footer-col">
            <h5>Review Principle</h5>
            <p className="ps-principle-quote">"{PRODUCT.reviewPrinciple}"</p>
            <small>{PRODUCT.reviewExplanation}</small>
          </div>
        </div>

        <div className="ps-footer-bottom">
          <p>© 2026 Project Similarity Detection System · Academic Integrity Hub. All rights reserved.</p>
          <p>Designed for explainable university project comparison.</p>
        </div>
      </footer>
    </main>
  );
}
