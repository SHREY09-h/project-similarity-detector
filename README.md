# Project Similarity Detection System

An explainable academic-review application that compares one submitted project with a historical repository. The result presents ranked matches, an overall similarity score and six visible evidence components.

## What the system compares

- Project-title language
- Abstract and description
- Optional project-report text
- Declared keywords
- MinHash text shingles
- Optional normalized source-code tokens

Uploaded source code is read as text and is never executed. Similarity supports reviewer judgment; it does not automatically declare plagiarism.

## Run locally on Windows

### Fastest reliable start

After installing the requirements once, run this from the project folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\run-website.ps1
```

This builds the tested frontend, starts both services and opens [http://127.0.0.1:5173](http://127.0.0.1:5173). Keep the services running while using the website.

### First-time setup

If the virtual environment does not exist yet:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd frontend
npm install
cd ..
```

### Manual start

Open two PowerShell terminals in this project folder.

### 1. Start the backend

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Start the frontend

```powershell
cd frontend
npm run build
npm run preview -- --host 127.0.0.1 --port 5173
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in a browser. The backend health endpoint is available at [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health).

## Quality checks

```powershell
cd frontend
npm run validate
```

The combined command runs the following checks. You can also run any one of them separately:

```powershell
npm run validate:content
npm run validate:scroll
npm run validate:readability
npm run validate:render
npm run lint
npm run build
```

```powershell
cd backend
..\.venv\Scripts\python.exe -m pytest tests -q
```

`validate:content` checks the visible component names, weights, text limits, upload rules, repository categories and classification thresholds against the backend. `validate:scroll` proves that all six wheel items land on the focus axis in order. `validate:readability` protects the contrast of essential text across the landing, form, story and results surfaces. `validate:render` renders every application route to catch route-specific UI failures.

When a submitted project or repository candidate has no report or source code, that component appears as **Not available**. It is excluded from the overall score instead of being shown as a misleading zero.

## If the site does not open

- Keep both PowerShell terminals running while using the site.
- Run `run-website.ps1` again after restarting the computer or closing the service terminals.
- Confirm the backend terminal says it is running on `http://127.0.0.1:8000`.
- Confirm the frontend terminal says it is running on `http://127.0.0.1:5173`.
- Open the `127.0.0.1` address shown above, not a saved file from the frontend folder.
- If the development server shows a blank page, use the tested `npm run build` and `npm run preview` commands above.
- If either port is already in use, close the older development terminal and start the command again.
