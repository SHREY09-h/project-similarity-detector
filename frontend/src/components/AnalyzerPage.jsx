import { useState } from 'react';
import { api } from '../services/api';
import { PRODUCT, PROJECT_CATEGORIES, PROJECT_TEXT_CONSTRAINTS, UPLOAD_CONSTRAINTS, WORKFLOW_STEPS } from '../content/systemContent';
import './AnalyzerPage.css';

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Attachment({ name, accept, icon, title, hint, file, onChange }) {
  return <label className={`composer-attachment ${file ? 'has-file' : ''}`}>
    <input type="file" name={name} accept={accept} onChange={event => onChange(event.target.files?.[0] || null)} />
    <span className="attachment-icon" aria-hidden="true">{file ? '✓' : icon}</span>
    <span><b>{file ? file.name : title}</b><small>{file ? `${formatFileSize(file.size)} selected` : hint}</small></span>
    <em>{file ? 'Change' : 'Browse'}</em>
  </label>;
}

function Processing({ stage }) {
  return <section className="composer-processing" aria-live="polite">
    <div className="processing-orbit" aria-hidden="true"><i/><i/><i/></div>
    <p>ANALYSIS IN PROGRESS</p>
    <h2>Comparing your project</h2>
    <div className="processing-track"><i style={{width:`${Math.min((stage + 1) / WORKFLOW_STEPS.length * 100, 100)}%`}}/></div>
    <span>{WORKFLOW_STEPS[Math.min(stage, WORKFLOW_STEPS.length - 1)].progressLabel}</span>
  </section>;
}

export default function AnalyzerPage({ onNavigate }) {
  const [category, setCategory] = useState(PROJECT_CATEGORIES[0].label);
  const [abstractLength, setAbstractLength] = useState(0);
  const [report, setReport] = useState(null);
  const [source, setSource] = useState(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    const reportName = report?.name.toLowerCase() || '';
    const sourceName = source?.name.toLowerCase() || '';
    if (report && report.size === 0) return setError('Project report is empty. Choose a file that contains report text.');
    if (report && !UPLOAD_CONSTRAINTS.report.extensions.some(extension => reportName.endsWith(extension))) return setError('Project report must be a PDF or TXT file.');
    if (report && report.size > UPLOAD_CONSTRAINTS.report.maxBytes) return setError(`Project report must be smaller than ${UPLOAD_CONSTRAINTS.report.maxLabel}.`);
    if (source && source.size === 0) return setError('Source-code file is empty. Choose a file that contains source text.');
    if (source && !UPLOAD_CONSTRAINTS.source.extensions.some(extension => sourceName.endsWith(extension))) return setError('Source code must be a ZIP or supported source file.');
    if (source && source.size > UPLOAD_CONSTRAINTS.source.maxBytes) return setError(`Source code must be smaller than ${UPLOAD_CONSTRAINTS.source.maxLabel}.`);
    setBusy(true);
    setStage(0);
    const timer = setInterval(() => setStage(value => Math.min(value + 1, WORKFLOW_STEPS.length - 1)), 360);
    try {
      const result = await api.analyze(new FormData(event.currentTarget));
      clearInterval(timer);
      onNavigate(`/results/${result.id}`);
    } catch (caught) {
      clearInterval(timer);
      setError(caught.message);
      setBusy(false);
    }
  }

  return <main className="analyzer-page">
    <div className="analyzer-aura" aria-hidden="true" />
    <header className="analyzer-intro">
      <p className="analyzer-eyebrow"><span aria-hidden="true">✦</span> NEW ANALYSIS</p>
      <h1>Find related projects.<br/>See why they match.</h1>
      <p className="analyzer-intro-copy">Describe one project, add any available files and compare it with every record in the historical repository.</p>
      <div className="analyzer-intro-meta" aria-label="Analysis capabilities">
        <span><b>01</b> Submission brief</span>
        <span><b>02</b> Six evidence signals</span>
        <span><b>03</b> Reviewer-led result</span>
      </div>
    </header>

    <section className="analysis-composer">
      {busy ? <Processing stage={stage}/> : <form onSubmit={submit}>
          <div className="composer-status">
          <div><span className="status-lock" aria-hidden="true">◇</span><p><b>Repository comparison ready</b><small>Every stored project will follow the same analysis</small></p></div>
          <a href="/projects" onClick={event => {event.preventDefault();onNavigate('/projects')}}>View repository ↗</a>
        </div>

          <div className="composer-section-heading">
            <span>01</span>
            <div><h2>Identify the submission</h2><p>Start with the project context your reviewer will recognize.</p></div>
          </div>

        <div className="composer-identity">
          <label><span>Project title <b>*</b></span><input name="title" required minLength={PROJECT_TEXT_CONSTRAINTS.title.minLength} maxLength={PROJECT_TEXT_CONSTRAINTS.title.maxLength} placeholder="e.g. Academic Project Similarity Checker" /></label>
          <label><span>Team or student</span><input name="team_name" placeholder="Optional team name" /></label>
        </div>

        <div className="composer-prompt">
          <div className="composer-section-heading"><span>02</span><div><h2>Describe the project</h2><p>Specific detail gives the comparison more useful context.</p></div><small>{abstractLength}/2000</small></div>
          <label className="composer-visually-hidden" htmlFor="project-abstract">Project description</label>
          <textarea id="project-abstract" name="abstract" required minLength={PROJECT_TEXT_CONSTRAINTS.abstract.minLength} maxLength={PROJECT_TEXT_CONSTRAINTS.abstract.maxLength} rows="6" aria-describedby="abstract-guidance" onChange={event => setAbstractLength(event.target.value.length)} placeholder="Describe the problem, approach, technologies and expected outcome. Include enough detail for an accurate comparison…" />
          <span className="prompt-hint" id="abstract-guidance">Required · {PROJECT_TEXT_CONSTRAINTS.abstract.minLength}–{PROJECT_TEXT_CONSTRAINTS.abstract.maxLength} characters</span>
        </div>

        <div className="composer-categories">
          <div className="composer-label" id="category-label"><span><i aria-hidden="true">⌁</i> Project category</span><small>Select one</small></div>
          <input type="hidden" name="category" value={category}/>
          <div className="category-chips" role="group" aria-labelledby="category-label">{PROJECT_CATEGORIES.map(item => <button type="button" className={category === item.label ? 'active' : ''} aria-pressed={category === item.label} onClick={() => setCategory(item.label)} key={item.label}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</div>
        </div>

        <div className="composer-files">
          <div className="composer-section-heading"><span>03</span><div><h2>Add supporting evidence</h2><p>Optional files help the examiner inspect stronger signals.</p></div></div>
          <div className="attachment-grid">
            <Attachment name="report" accept={UPLOAD_CONSTRAINTS.report.extensions.join(',')} icon="↥" title="Project report" hint={`PDF or TXT · up to ${UPLOAD_CONSTRAINTS.report.maxLabel}`} file={report} onChange={setReport}/>
            <Attachment name="source" accept={UPLOAD_CONSTRAINTS.source.extensions.join(',')} icon="</>" title="Source code" hint={`ZIP or source file · up to ${UPLOAD_CONSTRAINTS.source.maxLabel}`} file={source} onChange={setSource}/>
          </div>
        </div>

        <details className="composer-details">
          <summary><span><i aria-hidden="true">＋</i> Add supporting details</span><small>Keywords, academic year and implementation notes</small></summary>
          <div className="details-grid">
            <label><span>Keywords (comma-separated)</span><input name="keywords" placeholder="TF-IDF, cosine similarity, NLP" /></label>
            <label><span>Academic year</span><input name="academic_year" placeholder="2025–26" /></label>
            <label className="details-wide"><span>Implementation description</span><textarea name="description" rows="3" placeholder="Architecture, scope, frameworks and important implementation details…" /></label>
          </div>
        </details>

        {error && <p className="composer-error" role="alert">{error}</p>}
        <footer className="composer-footer"><p><span aria-hidden="true">◎</span> You will receive ranked matches and six visible component scores. {PRODUCT.reviewPrinciple}</p><button type="submit">Run project comparison <span aria-hidden="true">↗</span></button></footer>
      </form>}
    </section>
  </main>;
}
