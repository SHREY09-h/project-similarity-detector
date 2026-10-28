import { useRef, useState } from 'react';
import { api } from '../services/api';
import './ImportProjectsPage.css';

const formatBytes = bytes => (bytes / (1024 * 1024)).toFixed(1);

export default function ImportProjectsPage() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function chooseFile(event) {
    const next = event.target.files?.[0] || null;
    setFile(next);
    setPreview(null);
    setError('');
    setNotice('');
  }

  async function previewArchive() {
    if (!file) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setPreview(await api.previewProjectImport(file));
    } catch (caught) {
      setError(caught.message);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function importArchive() {
    if (!file || !preview?.ready_count) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api.importProjects(file);
      setNotice(`${result.imported_count} project${result.imported_count === 1 ? '' : 's'} added to the repository. They are ready for comparison.`);
      setFile(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (caught) {
      setError(caught.message);
    } finally {
      setBusy(false);
    }
  }

  function resetImport() {
    setFile(null);
    setPreview(null);
    setError('');
    setNotice('');
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <main className="app-page import-projects-page">
      <header className="page-title">
        <p className="eyebrow">GROW YOUR REFERENCE LIBRARY</p>
        <h1>Import project files</h1>
        <p>Bring a ZIP of past projects into your local repository. Imported projects are included in future comparisons.</p>
      </header>

      <div className="import-steps" aria-label="Import process">
        <div className={!preview ? 'current' : 'complete'}><span>1</span><b>Choose a ZIP</b></div>
        <i aria-hidden="true" />
        <div className={preview ? 'current' : ''}><span>2</span><b>Review projects</b></div>
        <i aria-hidden="true" />
        <div className={notice ? 'complete' : ''}><span>3</span><b>Add to repository</b></div>
      </div>

      <section className="import-workspace" aria-label="Import reference projects">
        <div className="import-panel">
          <div className="import-panel-heading">
            <div>
              <h2>{preview ? 'Review the ZIP contents' : 'Select a project collection'}</h2>
              <p>{preview ? 'Only valid projects without duplicate titles or content will be added.' : 'Choose an archive with one folder for each reference project.'}</p>
            </div>
            <span className="import-limit">ZIP · up to 20 MB</span>
          </div>

          <label className={`zip-picker ${file ? 'has-file' : ''}`} htmlFor="reference-project-zip">
            <span className="zip-icon" aria-hidden="true">{file ? '✓' : '⇧'}</span>
            <strong>{file ? file.name : 'Choose a ZIP file'}</strong>
            <span>{file ? `${formatBytes(file.size)} MB selected` : 'The project service reads it for preview; files are not extracted to disk.'}</span>
          </label>
          <input
            ref={inputRef}
            id="reference-project-zip"
            className="visually-hidden"
            type="file"
            accept=".zip,application/zip"
            onChange={chooseFile}
          />

          <div className="import-actions">
            {!preview ? (
              <button type="button" className="import-primary" disabled={!file || busy} onClick={previewArchive}>
                {busy ? 'Checking ZIP…' : 'Preview projects'}
              </button>
            ) : (
              <>
                <button type="button" className="import-primary" disabled={!preview.ready_count || busy} onClick={importArchive}>
                  {busy ? 'Adding projects…' : `Add ${preview.ready_count} project${preview.ready_count === 1 ? '' : 's'}`}
                </button>
                <button type="button" className="import-secondary" disabled={busy} onClick={resetImport}>Cancel</button>
              </>
            )}
          </div>
          {error && <p className="import-message error" role="alert">{error}</p>}
          {notice && <p className="import-message success" role="status">{notice} <a href="/projects">Browse repository</a></p>}
        </div>

        <aside className="import-format-panel">
          <h2>Prepare the ZIP</h2>
          <p>Each project needs its own folder and a <code>project.json</code> file.</p>
          <pre>{`references.zip
├── LibraryApp/
│   ├── project.json
│   ├── README.md
│   └── src/
└── CropDetector/
    ├── project.json
    ├── report.pdf
    └── src/`}</pre>
          <details>
            <summary>View project.json example</summary>
            <pre>{`{
  "title": "Library App",
  "abstract": "A library system for managing books and loans.",
  "description": "Search, borrowing, and return tracking.",
  "category": "Web Development",
  "keywords": ["library", "loans"]
}`}</pre>
          </details>
          <p className="import-safety-note">README, TXT, PDF, and supported source files are read as text. Uploaded code is never run.</p>
        </aside>
      </section>

      {preview && (
        <section className="import-preview" aria-live="polite">
          <div className="import-preview-heading">
            <div>
              <h2>Projects found</h2>
              <p>{preview.ready_count} ready · {preview.duplicate_count} duplicate · {preview.invalid_count} needs attention</p>
            </div>
            <span>{preview.projects.length} folder{preview.projects.length === 1 ? '' : 's'}</span>
          </div>
          <div className="import-project-list">
            {preview.projects.map(project => {
              const state = !project.valid ? 'invalid' : project.duplicate ? 'duplicate' : 'ready';
              const label = !project.valid ? 'Needs attention' : project.duplicate ? 'Already in repository' : 'Ready to add';
              return (
                <article className={`import-project-row ${state}`} key={project.folder}>
                  <div className="import-project-copy">
                    <div className="import-project-title"><h3>{project.title}</h3><span className={`import-state ${state}`}>{label}</span></div>
                    <p>{project.error || project.duplicate_reason || project.abstract || project.category}</p>
                    {project.valid && !project.duplicate && <small>{project.category || 'Other'} · {project.files_read} text files read</small>}
                  </div>
                  <span className="import-state-mark" aria-hidden="true">{state === 'ready' ? '+' : state === 'duplicate' ? '↺' : '!'}</span>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
