# Faculty Project Demonstration Guide

## Project

**Project Similarity Detection System** is a web application that compares a submitted academic project with project records in a repository. It returns ranked candidates, an overall similarity score, six evidence component scores, shared terms, and short explanations of the ranking. It is intended to support a faculty member's review; a score is not an automatic plagiarism decision.

## Work implemented in this project

- **Web application:** A React and Vite interface with a project submission form, repository search and filters, project detail pages, a comparison explanation page, and ranked analysis results.
- **API service:** A FastAPI backend with endpoints for health, algorithm information, repository projects, and creating and retrieving analyses.
- **Project repository:** A SQLAlchemy data model backed by SQLite by default. On a fresh database, the service loads ten clearly identifiable demonstration project records.
- **User reference imports:** Faculty can preview a ZIP of reference projects, see invalid folders and duplicates, and add eligible projects to the same comparison repository.
- **Comparison methods:** Title and abstract text comparison with TF-IDF and cosine similarity; optional local Ollama semantic embeddings with a TF-IDF fallback; keyword Jaccard overlap; 64-signature MinHash over three-token text shingles; and normalized source-code token comparison.
- **Explainable scoring:** Six weighted components (title 10%, abstract 25%, report 20%, keywords 15%, MinHash 10%, and code 20%). Report and code evidence are optional; unavailable components are excluded and the remaining weights are renormalized.
- **File handling:** Accepts PDF/TXT reports and supported source files or ZIPs within size limits. Uploaded code is treated as text and is never executed.
- **Faculty review support:** Results include evidence, shared terms, candidate details, a comparison view, print action, and a review decision/notes area. The decision and notes are saved in the current browser session only; they are not stored in the server database.
- **Setup and quality work:** Includes a Windows startup script, environment example, backend and root documentation, frontend content/scroll/readability/render validation scripts, linting, and backend unit tests.

The repository contains implementation files and documentation for these features. Git history currently shows an initial commit and one subsequent improvement commit; that history alone does not establish who authored each change. You can describe the items above as the work present in the project and clarify your own contribution when presenting.

## Run the project on this Windows device

### First-time setup

Install Python and Node.js/npm if they are not already installed. Then open PowerShell in the project folder and run:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd frontend
npm install
cd ..
```

### Start the demonstration

From the project folder, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-website.ps1
```

The script builds the website, starts the backend and frontend services, checks that both respond, and opens the site in your browser. Keep the services running while you demonstrate. The website is at [http://127.0.0.1:5173](http://127.0.0.1:5173); API health is at [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health), and interactive API documentation is at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

The first backend launch creates the local database and adds ten demonstration candidates if the project table is empty. Ollama is optional: if it is unavailable, abstract comparison falls back to local TF-IDF. The rest of the comparison runs locally.

## Suggested faculty walkthrough

1. **Introduce the goal.** Explain that the system ranks potentially related historical projects and shows evidence for a human reviewer.
2. **Show the process and methods.** Open the site's **How it works** page. Point out the six components and explain that missing report/code evidence is not treated as a zero.
3. **Add reference projects.** Open **Import projects** and select a ZIP with one project folder per reference. Each folder needs `project.json` and may include README/report/source files. Review the preview and add projects marked **Ready to add**. Duplicate titles/content are skipped, as are invalid folders.
4. **Show the repository.** Open **Projects**. Search for an imported project and show its description, category, keywords, and academic year. The ten seeded records remain available as demonstration candidates.
5. **Submit a comparison.** Open **Start comparison**. Enter a title and a project description of at least 20 characters. Select a category. Keywords, academic year, and implementation notes are optional. A PDF/TXT report and source file or ZIP are also optional.
6. **Run it.** Select **Run project comparison** and wait for the results page. Use a topic related to one of the projects you just imported.
7. **Explain the result.** Show the overall score and classification, then the individual components, evidence messages, shared concept terms, and ranked repository candidates. Use **Compare** on a candidate to inspect the side-by-side context.
8. **Show faculty review support.** Demonstrate the review decision and notes fields, then use the print action if a paper copy is useful. Explain that the saved decision currently lives only in that browser session.

For a ready-made report upload during the walkthrough, use `FACULTY_DEMO_REPORT.txt` from the project folder.

## Upload limits and supported formats

- Report: PDF or TXT, up to 10 MiB.
- Source: `.py`, `.js`, `.jsx`, `.ts`, `.tsx`, `.java`, `.cpp`, `.c`, `.h`, `.cs`, or ZIP, up to 5 MiB.
- ZIP processing reads up to 50 supported source files, each under 1 MiB. Source files are read as text and are not run.
- Reference-project import accepts ZIP files up to 20 MiB, with up to 50 projects, 500 ZIP entries, 1 MiB per file, 5 MiB of supported project files per project, and 60 MiB total uncompressed data. PDFs may contain up to 100 pages. Supported reference text includes Markdown, TXT, PDF and the listed source extensions.

## Key project areas

| Area | Location | Role |
| --- | --- | --- |
| Website pages and navigation | `frontend/src/App.jsx` | Repository, project details, results, and explanatory pages |
| Project submission form | `frontend/src/components/AnalyzerPage.jsx` | Captures project details and optional files |
| Reference project import | `frontend/src/components/ImportProjectsPage.jsx`, `backend/app/project_import.py` | Previews safe ZIP contents, detects duplicates and imports project records |
| API client | `frontend/src/services/api.js` | Connects the website to the backend |
| Backend routes and upload processing | `backend/app/main.py` | Handles API requests, parsing, and analysis storage |
| Similarity algorithms and scoring | `backend/app/similarity/engine.py` | Computes component scores, ranking evidence, and classification |
| Optional local semantic comparison | `backend/app/similarity/ollama.py` | Uses local Ollama when available; supports fallback |
| Database models and sample records | `backend/app/models.py`, `backend/app/seed.py` | Defines stored data and initial demo candidates |
| Startup helper | `run-website.ps1` | Builds and starts the local demonstration |

## Known scope and limitations to explain

- The default database is local SQLite and the sample repository is for demonstration. Institution-wide deployment would need an approved hosted database, authentication, access controls, and an actual project archive.
- Similarity is sensitive to the submitted description and to which evidence exists for both projects. Scores help prioritize review and do not prove copying or misconduct.
- Ollama embeddings require the local Ollama service and a compatible model. The application can still compare projects without it using TF-IDF.
- Faculty decisions and reviewer notes are currently session-only browser data, not persistent records.

## Short presentation summary

> I built a full-stack academic project similarity review prototype. A student or reviewer submits a project description and optional report/source files. The system compares it with a project repository using text, keyword, shingle, and normalized code signals, then presents ranked matches with component scores and evidence so a faculty member can make the final judgment. The current version runs locally on Windows and includes seeded demonstration projects.
