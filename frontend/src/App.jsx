import { useEffect, useState } from 'react';
import { api } from './services/api';
import AnalyzerPage from './components/AnalyzerPage';
import ServiceLanding from './components/ServiceLanding';
import {
  COMPARISON_METHODS,
  EVIDENCE_COMPONENTS,
  NAV_ITEMS,
  PRODUCT,
  PROJECT_CATEGORIES,
  SIMILARITY_LEVELS,
  WORKFLOW_STEPS
} from './content/systemContent';

const go = p => {
  history.pushState({}, '', p);
  dispatchEvent(new PopStateEvent('popstate'));
};

function Link({ to, children, className = '', ...props }) {
  return (
    <a
      href={to}
      className={className}
      {...props}
      onClick={e => {
        props.onClick?.(e);
        if (!e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          e.preventDefault();
          go(to);
        }
      }}
    >
      {children}
    </a>
  );
}

function Header() {
  const closeMenu = e => e.currentTarget.closest('details')?.removeAttribute('open');
  const path = location.pathname;
  const isCurrent = to => path === to || (to === '/projects' && path.startsWith('/projects/'));

  return (
    <header className="header">
      <Link to="/" className="brand" aria-label="Project Similarity Detection System Home">
        <span className="brand-icon">PS</span>
        <div className="brand-text-wrap">
          <strong>{PRODUCT.name}</strong>
          <small className="brand-hub-badge">Academic Integrity Hub</small>
        </div>
      </Link>

      <nav aria-label="Main navigation" className="header-nav-center">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item-link ${isCurrent(item.path) ? 'active' : ''}`}
            aria-current={isCurrent(item.path) ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="header-right-actions">
        <div className="header-status-badge" title="FastAPI Similarity Engine is running">
          <span className="pulse-dot" />
          <small>Engine Online</small>
        </div>
        <Link to="/analyze" className="nav-cta">
          <span>Start comparison</span>
          <i aria-hidden="true">→</i>
        </Link>
      </div>

      <details className="header-menu">
        <summary aria-label="Toggle navigation menu">
          Menu <span aria-hidden="true">+</span>
        </summary>
        <nav aria-label="Mobile navigation">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isCurrent(item.path) ? 'page' : undefined}
              onClick={closeMenu}
            >
              {item.mobileLabel}
            </Link>
          ))}
          <Link to="/analyze" className="mobile-cta-link" onClick={closeMenu}>
            + Start comparison
          </Link>
        </nav>
      </details>
    </header>
  );
}

function Projects() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ search: query, sort });
    if (category) params.set('category', category);

    const timer = setTimeout(() => {
      api.projects(`?${params}`)
        .then(data => {
          if (active) setItems(data);
        })
        .catch(e => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, category, sort]);

  return (
    <main className="app-page repository-page">
      <PageTitle
        eyebrow="HISTORICAL REPOSITORY"
        title="Browse comparison projects"
        copy="Explore the historical records used as candidates during each similarity analysis. Search by topic or filter by academic domain."
      />

      {/* Category Pills Filter Row */}
      <div className="category-filter-pills" role="group" aria-label="Filter projects by category">
        <button
          type="button"
          className={`pill-btn ${category === '' ? 'active' : ''}`}
          onClick={() => setCategory('')}
        >
          All categories
        </button>
        {PROJECT_CATEGORIES.map(item => (
          <button
            type="button"
            key={item.label}
            className={`pill-btn ${category === item.label ? 'active' : ''}`}
            onClick={() => setCategory(item.label)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <section className="repository-toolbar" aria-label="Repository filters">
        <label className="repository-search">
          <span>Search repository</span>
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search by title, abstract or keywords…"
          />
        </label>
        <label>
          <span>Category</span>
          <select value={category} onChange={event => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {PROJECT_CATEGORIES.map(item => (
              <option value={item.label} key={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort by</span>
          <select value={sort} onChange={event => setSort(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Project title</option>
          </select>
        </label>
        <span className="repository-count" aria-live="polite">
          {loading ? 'Loading projects…' : `${items.length} ${items.length === 1 ? 'project' : 'projects'} indexed`}
        </span>
      </section>

      {error && <p className="error" role="alert">{error}</p>}

      {!loading && !error && items.length === 0 ? (
        <section className="empty-state">
          <span className="empty-icon" aria-hidden="true">📂</span>
          <b>No matching projects found</b>
          <p>Try a broader search term or choose another academic domain category.</p>
          <button
            type="button"
            className="ps-btn ps-btn-primary"
            onClick={() => {
              setQuery('');
              setCategory('');
              setSort('newest');
            }}
          >
            Clear all filters
          </button>
        </section>
      ) : (
        <div className="project-grid">
          {items.map(p => (
            <article className="project-card" key={p.id}>
              <div className="project-card-header">
                <span className="category-chip">{p.category}</span>
                <b className="year-tag">{p.academic_year || 'Academic Record'}</b>
              </div>
              <h2>
                <Link to={'/projects/' + p.id}>{p.title}</Link>
              </h2>
              <p className="project-abstract-snippet">{p.abstract}</p>
              {p.keywords && p.keywords.length > 0 && (
                <div className="project-keywords-row">
                  {p.keywords.slice(0, 3).map(kw => (
                    <span key={kw} className="mini-chip">#{kw}</span>
                  ))}
                  {p.keywords.length > 3 && <small className="more-kw">+{p.keywords.length - 3}</small>}
                </div>
              )}
              <footer className="project-card-footer">
                <small className="team-text">{p.team_name || 'Academic Project Group'}</small>
                <Link to={'/projects/' + p.id} className="card-view-link">
                  <span>View details</span>
                  <i aria-hidden="true">→</i>
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function ProjectDetail({ id }) {
  const [p, setP] = useState();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setError('');
    api.project(id)
      .then(data => {
        if (active) setP(data);
      })
      .catch(e => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (error) {
    return (
      <main className="app-page">
        <p className="error" role="alert">{error}</p>
        <Link to="/projects" className="button-link">Return to repository →</Link>
      </main>
    );
  }

  if (!p) {
    return (
      <main className="app-page">
        <p className="loading-state">Loading project…</p>
      </main>
    );
  }

  return (
    <main className="app-page project-detail-page">
      <Link to="/projects" className="back">
        <i aria-hidden="true">←</i> Back to repository
      </Link>

      <article className="detail">
        <header className="detail-heading">
          <p className="eyebrow">{p.category} · {p.academic_year || 'Academic year not set'}</p>
          <h1>{p.title}</h1>
          <div className="abstract-callout">
            <span>PROJECT ABSTRACT / SUMMARY</span>
            <p>{p.abstract}</p>
          </div>
        </header>

        <div className="detail-layout">
          <div className="detail-content">
            <section>
              <p className="detail-label">01 · TECHNICAL SCOPE & IMPLEMENTATION</p>
              <h2>What this project covers</h2>
              <p>{p.description || 'No additional implementation description was provided for this repository project.'}</p>
            </section>

            <section>
              <p className="detail-label">02 · DECLARED KEYWORDS & CONCEPTS</p>
              <h2>Project topics</h2>
              {p.keywords && p.keywords.length > 0 ? (
                <div className="chips">
                  {p.keywords.map(keyword => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
              ) : (
                <p>No keywords were provided.</p>
              )}
            </section>
          </div>

          <aside className="detail-facts">
            <h2>Project Record</h2>
            <dl>
              <dt>Team / Author</dt>
              <dd>{p.team_name || 'Academic Student Group'}</dd>
              <dt>Domain Category</dt>
              <dd>{p.category || 'Other'}</dd>
              <dt>Academic Year</dt>
              <dd>{p.academic_year || 'Not specified'}</dd>
              <dt>Indexed On</dt>
              <dd>{new Date(p.created_at).toLocaleDateString()}</dd>
            </dl>
            <Link to="/analyze" className="button-link">
              Compare a project against this →
            </Link>
          </aside>
        </div>
      </article>
    </main>
  );
}

function Results({ id }) {
  const [a, setA] = useState();
  const [error, setError] = useState('');
  const [compareTarget, setCompareTarget] = useState(null);
  const [facultyDecision, setFacultyDecision] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(`decision_${id}`) || '';
    }
    return '';
  });
  const [facultyNotes, setFacultyNotes] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return sessionStorage.getItem(`notes_${id}`) || '';
    }
    return '';
  });
  const [savedNotification, setSavedNotification] = useState(false);

  useEffect(() => {
    let active = true;
    setError('');
    api.analysis(id)
      .then(data => {
        if (active) setA(data);
      })
      .catch(e => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleSaveDecision = (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(`decision_${id}`, facultyDecision);
      sessionStorage.setItem(`notes_${id}`, facultyNotes);
    }
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  if (error) {
    return (
      <main className="app-page">
        <p className="error" role="alert">{error}</p>
        <Link to="/analyze" className="button-link">Start a new comparison →</Link>
      </main>
    );
  }

  if (!a) {
    return (
      <main className="app-page">
        <p className="loading-state">Loading analysis…</p>
      </main>
    );
  }

  const top = a.results[0];
  const level = SIMILARITY_LEVELS.find(item => item.label === a.classification);

  if (!top) {
    return (
      <main className="app-page results">
        <div className="result-head">
          <div>
            <p className="eyebrow">ANALYSIS #{a.id}</p>
            <h1>{a.title}</h1>
            <p>Completed {new Date(a.created_at).toLocaleString()}</p>
          </div>
        </div>
        <section className="result-empty">
          <span aria-hidden="true">◇</span>
          <h2>No repository matches are available yet.</h2>
          <p>Add historical projects to the repository, then run this comparison again.</p>
          <Link to="/projects" className="button-link">Open repository →</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-page results">
      {/* Side-by-Side Comparison Modal */}
      {compareTarget && (
        <div className="comparison-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="comparison-modal-card">
            <div className="modal-head">
              <div>
                <span className="eyebrow">SIDE-BY-SIDE PROJECT COMPARISON</span>
                <h3 id="modal-title">Project A vs Repository Candidate #{compareTarget.rank}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setCompareTarget(null)}
                aria-label="Close comparison modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-comparison-grid">
              <div className="modal-col">
                <span className="col-tag">SUBMITTED PROJECT A</span>
                <h4>{a.title}</h4>
                <p className="col-meta">{a.category} · {a.academic_year || '2025-26'} · {a.team_name || 'Student Group'}</p>
              </div>

              <div className="modal-col-vs">
                <strong className="modal-vs-score">{Math.round(compareTarget.score * 100)}%</strong>
                <small>{compareTarget.classification}</small>
              </div>

              <div className="modal-col">
                <span className="col-tag">REPOSITORY CANDIDATE B</span>
                <h4>{compareTarget.project.title}</h4>
                <p className="col-meta">{compareTarget.project.category} · {compareTarget.project.academic_year || 'Historical Record'}</p>
                <p className="col-abstract">{compareTarget.project.abstract}</p>
              </div>
            </div>

            <div className="modal-breakdown-section">
              <h4>Evidence Component Alignment</h4>
              <Breakdown components={compareTarget.components} />
            </div>

            {compareTarget.evidence && compareTarget.evidence.length > 0 && (
              <div className="modal-evidence-list">
                <h4>Why this project ranked highly:</h4>
                <ul>
                  {compareTarget.evidence.map((item, idx) => (
                    <li key={idx}>✓ {item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="modal-footer">
              <button type="button" className="ps-btn ps-btn-primary" onClick={() => setCompareTarget(null)}>
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="result-head">
        <div>
          <p className="eyebrow">ANALYSIS REPORT #{a.id}</p>
          <h1>{a.title}</h1>
          <p>
            Completed {new Date(a.created_at).toLocaleString()} · Compared against {a.results.length} repository candidate records
          </p>
        </div>
        <div className="result-head-actions">
          <button type="button" className="ps-btn ps-btn-glass" onClick={() => window.print()}>
            <span>Print / Save PDF Report</span>
            <i aria-hidden="true">🖨</i>
          </button>
        </div>
      </div>

      {/* Overall Score Banner */}
      <section className="overall">
        <div className="overall-score-gauge">
          <small>OVERALL EVIDENCE SCORE</small>
          <strong>{Math.round(a.overall_score * 100)}%</strong>
          <span className={`classification-badge level-${a.classification.toLowerCase().replace(/\s+/g, '-')}`}>
            {a.classification}
          </span>
        </div>
        <div className="overall-explanation">
          <b>{PRODUCT.reviewPrinciple}</b>
          <p>{level?.guidance} Review the six individual component scores and project context before drawing a formal academic conclusion.</p>
        </div>
      </section>

      {/* Top Match Highlight */}
      <section className="top-match">
        <header className="top-match-heading">
          <div>
            <p className="eyebrow">CLOSEST REPOSITORY MATCH</p>
            <h2>
              <Link to={'/projects/' + top.project.id}>{top.project.title}</Link>
            </h2>
          </div>
          <div className="top-match-score-box">
            <strong>{Math.round(top.score * 100)}%</strong>
            <button
              type="button"
              className="side-by-side-btn"
              onClick={() => setCompareTarget(top)}
            >
              Side-by-Side View ↗
            </button>
          </div>
        </header>

        <p className="top-match-summary">{top.project.abstract}</p>

        <div className="result-section-label">
          <span>01</span>
          <div>
            <h3>Component Breakdown</h3>
            <p>Each meter represents an independent similarity signal. Missing files redistribute weight instead of showing zero.</p>
          </div>
        </div>
        <Breakdown components={top.components} />

        <div className="result-evidence-grid">
          <div>
            <div className="result-section-label">
              <span>02</span>
              <div>
                <h3>Evidence Behind This Ranking</h3>
                <p>Transparent reasons generated from NLP tokens, shingles and code structures.</p>
              </div>
            </div>
            {top.evidence.length > 0 ? (
              <ul className="evidence-points-list">
                {top.evidence.map(x => (
                  <li key={x}>
                    <span className="check-bullet">✓</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-copy">No additional evidence statement was generated.</p>
            )}
          </div>

          <div>
            <div className="result-section-label">
              <span>03</span>
              <div>
                <h3>Shared Concept Terms</h3>
                <p>Meaningful topic intersections across both abstracts and keywords.</p>
              </div>
            </div>
            {top.shared_keywords.length > 0 ? (
              <div className="chips">
                {top.shared_keywords.map(x => (
                  <span key={x}>{x}</span>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No meaningful topic terms overlap.</p>
            )}
          </div>
        </div>
      </section>

      {/* Faculty Review & Evaluation Decision Recorder */}
      <section className="faculty-review-card" aria-labelledby="faculty-review-heading">
        <header className="faculty-review-head">
          <span className="eyebrow">FACULTY EVALUATION & DECISION SUPPORT</span>
          <h2 id="faculty-review-heading">Record Academic Review Judgment</h2>
          <p>Similarity is an evidence signal for human evaluation. Record your academic verification verdict below.</p>
        </header>

        <form onSubmit={handleSaveDecision} className="faculty-review-form">
          <div className="decision-choices-row">
            <label className={`decision-chip ${facultyDecision === 'Approved' ? 'active' : ''}`}>
              <input
                type="radio"
                name="decision"
                value="Approved"
                checked={facultyDecision === 'Approved'}
                onChange={e => setFacultyDecision(e.target.value)}
              />
              <span>🟢 Approved (Original Work)</span>
            </label>

            <label className={`decision-chip ${facultyDecision === 'Reviewed' ? 'active' : ''}`}>
              <input
                type="radio"
                name="decision"
                value="Reviewed"
                checked={facultyDecision === 'Reviewed'}
                onChange={e => setFacultyDecision(e.target.value)}
              />
              <span>🟡 Mark as Reviewed (Acceptable Overlap)</span>
            </label>

            <label className={`decision-chip ${facultyDecision === 'Investigation' ? 'active' : ''}`}>
              <input
                type="radio"
                name="decision"
                value="Investigation"
                checked={facultyDecision === 'Investigation'}
                onChange={e => setFacultyDecision(e.target.value)}
              />
              <span>🟠 Needs Closer Investigation</span>
            </label>

            <label className={`decision-chip ${facultyDecision === 'Flagged' ? 'active' : ''}`}>
              <input
                type="radio"
                name="decision"
                value="Flagged"
                checked={facultyDecision === 'Flagged'}
                onChange={e => setFacultyDecision(e.target.value)}
              />
              <span>🔴 Flag High Similarity</span>
            </label>
          </div>

          <div className="faculty-notes-wrap">
            <label htmlFor="faculty-notes">
              <b>Reviewer Notes & Justification (Optional):</b>
            </label>
            <textarea
              id="faculty-notes"
              rows="3"
              value={facultyNotes}
              onChange={e => setFacultyNotes(e.target.value)}
              placeholder="e.g., Both projects address automated attendance, but implementation architectures and ML algorithms are distinct."
            />
          </div>

          <div className="faculty-form-actions">
            <button type="submit" className="ps-btn ps-btn-primary">
              Save Academic Decision to Record
            </button>
            {savedNotification && <span className="saved-toast">✓ Decision saved successfully!</span>}
          </div>
        </form>
      </section>

      {/* Ranked Candidate Leaderboard */}
      <div className="ranked-heading">
        <div>
          <p className="eyebrow">REPOSITORY RANKING</p>
          <h2>All Returned Candidate Matches</h2>
        </div>
        <p>Ordered from the strongest available evidence score to the weakest.</p>
      </div>

      <div className="matches">
        {a.results.map(r => (
          <article className="match-row" key={r.rank}>
            <b className="match-rank-badge">#{r.rank}</b>
            <div className="match-info">
              <h3>
                <Link to={'/projects/' + r.project.id}>{r.project.title}</Link>
              </h3>
              <div className="match-meta-line">
                <span className="match-cat-tag">{r.project.category}</span>
                <span className="match-class-tag">{r.classification}</span>
              </div>
            </div>
            <div className="match-actions">
              <button
                type="button"
                className="match-compare-btn"
                onClick={() => setCompareTarget(r)}
              >
                Compare ↗
              </button>
              <strong className="match-score">{Math.round(r.score * 100)}%</strong>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function Breakdown({ components }) {
  return (
    <div className="breakdown">
      {EVIDENCE_COMPONENTS.map(component => {
        const value = components?.[component.key];
        const available = value !== null && value !== undefined;
        const percentage = available ? Math.round(value * 100) : null;

        return (
          <div className={`metric ${available ? '' : 'metric-unavailable'}`} key={component.key}>
            <div className="metric-label">
              <span className="metric-title-group">
                <i className="metric-icon" aria-hidden="true">{component.icon}</i>
                <b>{component.label}</b>
                <small className="metric-method-tag">{component.method}</small>
              </span>
              <strong className="metric-percentage">
                {available ? `${percentage}%` : 'Not available'}
              </strong>
            </div>
            {available ? (
              <i
                role="progressbar"
                aria-label={`${component.label} similarity`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={percentage}
              >
                <em
                  style={{
                    width: `${percentage}%`,
                    background:
                      percentage >= 80 ? 'linear-gradient(90deg, #ff7a6b, #ffb36b)' :
                      percentage >= 50 ? 'linear-gradient(90deg, #ffc36b, #a995ff)' :
                                         'linear-gradient(90deg, #65d8ff, #a995ff)'
                  }}
                />
              </i>
            ) : (
              <i aria-hidden="true"><em /></i>
            )}
          </div>
        );
      })}
    </div>
  );
}

function How() {
  return (
    <main className="app-page how-page">
      <PageTitle
        eyebrow="TRANSPARENT BY DESIGN"
        title="How the comparison works"
        copy="Follow the evidence from project submission to an explainable repository ranking. Built for academic integrity and reviewer decision support."
      />

      <section className="how-section" aria-labelledby="workflow-title">
        <header className="how-section-heading">
          <div>
            <span>01</span>
            <p>THE PROCESS</p>
          </div>
          <h2 id="workflow-title">One process.<br />Five clear stages.</h2>
          <p>Every repository project follows the same path, making results repeatable and easier to review.</p>
        </header>
        <div className="how-grid">
          {WORKFLOW_STEPS.map(step => (
            <article key={step.number}>
              <b>STEP {step.number}</b>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" aria-labelledby="methods-title">
        <header className="how-section-heading">
          <div>
            <span>02</span>
            <p>THE METHODS</p>
          </div>
          <h2 id="methods-title">Four methods.<br />Each has one job.</h2>
          <p>The system combines semantic language comparison, direct overlap, text shingles and normalized source structure.</p>
        </header>
        <div className="method-grid">
          {COMPARISON_METHODS.map((method, index) => (
            <article key={method.key}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <b>{method.short}</b>
              <h3>{method.label}</h3>
              <p>{method.purpose}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" aria-labelledby="components-title">
        <header className="how-section-heading">
          <div>
            <span>03</span>
            <p>THE SCORE</p>
          </div>
          <h2 id="components-title">Six components.<br />One explained result.</h2>
          <p>Base weights total 100%. If report or source-code evidence is unavailable, its weight is redistributed across the components that can be compared.</p>
        </header>
        <div className="component-reference">
          {EVIDENCE_COMPONENTS.map(component => (
            <article key={component.key}>
              <div>
                <span aria-hidden="true">{component.icon}</span>
                <p>
                  <b>{component.label}</b>
                  <small>{component.method}</small>
                </p>
              </div>
              <strong>{component.weight}%</strong>
              <em>{component.optional ? 'Optional evidence' : 'Core evidence'}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" aria-labelledby="levels-title">
        <header className="how-section-heading">
          <div>
            <span>04</span>
            <p>THE LABELS</p>
          </div>
          <h2 id="levels-title">A score range.<br />Not a decision.</h2>
          <p>Classification labels help reviewers prioritize attention. They describe score ranges, not intent, misconduct or originality.</p>
        </header>
        <div className="classification-guide">
          {SIMILARITY_LEVELS.map(level => (
            <article key={level.key}>
              <span>{level.range}</span>
              <h3>{level.label}</h3>
              <p>{level.guidance}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="notice">
        <b>{PRODUCT.reviewPrinciple}</b>
        <p>A high score can reflect a shared domain, standard terminology, legitimate reuse or a case that deserves closer inspection. {PRODUCT.reviewExplanation}</p>
      </aside>
    </main>
  );
}

function PageTitle({ eyebrow, title, copy }) {
  return (
    <header className="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{copy}</p>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div>
        <b>{PRODUCT.fullName}</b>
        <p>Explainable repository comparison for reviewer-led academic decisions.</p>
      </div>
      <div>
        <b>Navigate</b>
        {NAV_ITEMS.map(item => (
          <Link key={item.path} to={item.path}>
            {item.mobileLabel}
          </Link>
        ))}
      </div>
      <div>
        <b>Four comparison methods</b>
        {COMPARISON_METHODS.map(method => (
          <span key={method.key}>{method.label}</span>
        ))}
      </div>
      <div>
        <b>Review principle</b>
        <span>Evidence before conclusions</span>
        <small>{PRODUCT.reviewExplanation}</small>
      </div>
    </footer>
  );
}

export default function App() {
  const [path, setPath] = useState(location.pathname);

  useEffect(() => {
    const f = () => {
      setPath(location.pathname);
      scrollTo(0, 0);
    };
    addEventListener('popstate', f);
    return () => removeEventListener('popstate', f);
  }, []);

  useEffect(() => {
    const pageName =
      path === '/'
        ? 'Deep Academic Project Similarity Engine'
        : path === '/analyze'
        ? 'New Project Analysis'
        : path === '/projects'
        ? 'Project Repository'
        : path === '/how-it-works'
        ? 'How the Comparison Works'
        : path.startsWith('/results/')
        ? 'Analysis Results'
        : path.startsWith('/projects/')
        ? 'Project Details'
        : 'Page Not Found';
    document.title = `${pageName} | Project Similarity`;
  }, [path]);

  if (path === '/') return <ServiceLanding onNavigate={go} />;

  let page =
    path === '/analyze' ? (
      <AnalyzerPage onNavigate={go} />
    ) : path === '/projects' ? (
      <Projects />
    ) : path === '/how-it-works' ? (
      <How />
    ) : path.startsWith('/results/') ? (
      <Results id={path.split('/')[2]} />
    ) : path.startsWith('/projects/') ? (
      <ProjectDetail id={path.split('/')[2]} />
    ) : (
      <main className="app-page">
        <PageTitle
          eyebrow="404 ERROR"
          title="Page not found"
          copy="The page may have moved or the address may be incorrect."
        />
        <Link to="/" className="button-link">Return home →</Link>
      </main>
    );

  return (
    <>
      <Header />
      {page}
      <Footer />
    </>
  );
}
