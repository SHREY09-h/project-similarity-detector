"""Safe parsing helpers for user-supplied reference-project ZIP files."""

import hashlib
import io
import json
import stat
import zipfile
from pathlib import PurePosixPath

from fastapi import HTTPException
from pypdf import PdfReader


MAX_ARCHIVE_BYTES = 20 * 1024 * 1024
MAX_ARCHIVE_FILES = 500
MAX_PROJECTS = 50
MAX_FILE_BYTES = 1 * 1024 * 1024
MAX_PROJECT_BYTES = 5 * 1024 * 1024
MAX_TOTAL_UNPACKED_BYTES = 60 * 1024 * 1024
MAX_TEXT_CHARS = 2_000_000
CODE_EXTENSIONS = {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".cpp", ".c", ".h", ".cs"}
TEXT_EXTENSIONS = CODE_EXTENSIONS | {".md", ".txt", ".pdf"}
IGNORED_PARTS = {".git", "node_modules", "venv", ".venv", "__pycache__", "dist", "build"}


def _clean_text(value):
    return "\n".join(str(value or "").replace("\x00", "").splitlines()).strip()


def project_fingerprint(project):
    """Return a stable digest for project evidence, independent of its title."""
    normalized = {
        key: _clean_text(project.get(key))
        for key in ("abstract", "description", "report_text", "source_code")
    }
    normalized["keywords"] = sorted(str(item).strip().casefold() for item in (project.get("keywords") or []) if str(item).strip())
    canonical = json.dumps(normalized, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _read_member(archive, info):
    with archive.open(info) as stream:
        data = stream.read(MAX_FILE_BYTES + 1)
    if len(data) > MAX_FILE_BYTES:
        raise ValueError(f"{info.filename} exceeds the 1 MiB per-file limit")
    return data


def _extract_project(archive, folder, members):
    manifest_path = next((name for name in members if name.casefold() == f"{folder}/project.json".casefold()), None)
    if not manifest_path:
        return {"folder": folder, "valid": False, "error": "Missing project.json at the top of this project folder."}

    try:
        manifest_bytes = _read_member(archive, members[manifest_path])
        manifest = json.loads(manifest_bytes.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        return {"folder": folder, "valid": False, "error": f"Could not read project.json: {exc}"}
    if not isinstance(manifest, dict):
        return {"folder": folder, "valid": False, "error": "project.json must contain a JSON object."}

    if not isinstance(manifest.get("title"), str):
        return {"folder": folder, "valid": False, "error": "Project title must be a text value."}
    title = _clean_text(manifest.get("title"))
    if not 3 <= len(title) <= 240:
        return {"folder": folder, "valid": False, "error": "Project title must be between 3 and 240 characters."}
    for field in ("abstract", "description", "category", "academic_year", "team_name"):
        if manifest.get(field) is not None and not isinstance(manifest[field], str):
            return {"folder": folder, "valid": False, "error": f"{field} must be a text value."}

    report_parts = []
    source_parts = []
    files_read = 0
    bytes_read = len(manifest_bytes)
    for name, info in sorted(members.items(), key=lambda item: item[0].casefold()):
        if name == manifest_path or PurePosixPath(name).suffix.lower() not in TEXT_EXTENSIONS:
            continue
        path_parts = PurePosixPath(name).parts
        if any(part.casefold() in IGNORED_PARTS for part in path_parts):
            continue
        try:
            payload = _read_member(archive, info)
            bytes_read += len(payload)
            if bytes_read > MAX_PROJECT_BYTES:
                return {"folder": folder, "valid": False, "error": "Project files exceed the 5 MiB per-project limit."}
            extension = PurePosixPath(name).suffix.lower()
            if extension == ".pdf":
                pdf = PdfReader(io.BytesIO(payload))
                if len(pdf.pages) > 100:
                    return {"folder": folder, "valid": False, "error": f"{name} exceeds the 100-page PDF limit."}
                text = "\n".join(page.extract_text() or "" for page in pdf.pages)
            else:
                text = payload.decode("utf-8", errors="replace")
            text = _clean_text(text)
            if not text:
                continue
            files_read += 1
            relative_name = str(PurePosixPath(name).relative_to(folder))
            if extension in CODE_EXTENSIONS:
                source_parts.append(f"\n# File: {relative_name}\n{text}")
            else:
                report_parts.append(f"\n## File: {relative_name}\n{text}")
        except Exception as exc:
            return {"folder": folder, "valid": False, "error": f"Could not read {name}: {exc}"}

    report_text = "\n".join(report_parts)[:MAX_TEXT_CHARS]
    source_code = "\n".join(source_parts)[:MAX_TEXT_CHARS]
    description = _clean_text(manifest.get("description"))[:4000]
    abstract = _clean_text(manifest.get("abstract") or description or report_text)[:2000]
    if len(abstract) < 20:
        return {"folder": folder, "valid": False, "error": "Add an abstract, description, or README/report with at least 20 characters."}

    keywords = manifest.get("keywords") or []
    if not isinstance(keywords, list) or any(not isinstance(item, str) for item in keywords):
        return {"folder": folder, "valid": False, "error": "keywords must be a list of text values."}

    project = {
        "title": title,
        "abstract": abstract,
        "description": description,
        "keywords": list(dict.fromkeys(_clean_text(item)[:80] for item in keywords if _clean_text(item)))[:30],
        "category": _clean_text(manifest.get("category") or "Other")[:80],
        "academic_year": _clean_text(manifest.get("academic_year"))[:20],
        "team_name": _clean_text(manifest.get("team_name"))[:160],
        "report_text": report_text,
        "source_code": source_code,
    }
    return {
        "folder": folder,
        "valid": True,
        "files_read": files_read,
        "project": project,
        "fingerprint": project_fingerprint(project),
    }


def parse_project_archive(data):
    """Read and validate the documented ZIP structure without extracting files."""
    if not data:
        raise HTTPException(400, "Choose a ZIP file to import.")
    if len(data) > MAX_ARCHIVE_BYTES:
        raise HTTPException(413, "The project ZIP must be 20 MiB or smaller.")
    try:
        archive = zipfile.ZipFile(io.BytesIO(data))
    except (zipfile.BadZipFile, OSError):
        raise HTTPException(400, "The upload is not a valid ZIP archive.")

    with archive:
        infos = archive.infolist()
        if len(infos) > MAX_ARCHIVE_FILES:
            raise HTTPException(400, f"The ZIP can contain at most {MAX_ARCHIVE_FILES} files and folders.")
        if sum(info.file_size for info in infos) > MAX_TOTAL_UNPACKED_BYTES:
            raise HTTPException(400, "The uncompressed ZIP contents exceed the 60 MiB limit.")

        folders = set()
        members_by_folder = {}
        seen_names = set()
        for info in infos:
            name = info.filename
            if "\\" in name or name.startswith("/") or ":" in name.split("/", 1)[0]:
                raise HTTPException(400, "The ZIP contains an unsafe file path.")
            raw_parts = name.split("/")
            if info.is_dir() and raw_parts[-1] == "":
                raw_parts = raw_parts[:-1]
            if any(part in ("", ".", "..") for part in raw_parts):
                raise HTTPException(400, "The ZIP contains an unsafe file path.")
            path = PurePosixPath(name)
            if any(part in ("..", "") for part in path.parts):
                raise HTTPException(400, "The ZIP contains an unsafe file path.")
            normalized_name = name.casefold()
            if normalized_name in seen_names:
                raise HTTPException(400, "The ZIP contains duplicate file paths.")
            seen_names.add(normalized_name)
            if info.flag_bits & 0x1:
                raise HTTPException(400, "Password-protected ZIP files are not supported.")
            file_mode = (info.external_attr >> 16) & 0o170000
            if file_mode == stat.S_IFLNK:
                raise HTTPException(400, "The ZIP contains a symbolic link, which is not supported.")
            if info.is_dir():
                continue
            if info.file_size > MAX_FILE_BYTES:
                raise HTTPException(400, f"Each file must be 1 MiB or smaller: {name}")
            if len(path.parts) < 2:
                raise HTTPException(400, "Put each project inside its own top-level folder.")
            folder = path.parts[0]
            folders.add(folder)
            members_by_folder.setdefault(folder, {})[name] = info

        if not folders:
            raise HTTPException(400, "The ZIP does not contain any project folders.")
        if len(folders) > MAX_PROJECTS:
            raise HTTPException(400, f"The ZIP can contain at most {MAX_PROJECTS} projects.")

        result = []
        for folder in sorted(folders, key=str.casefold):
            result.append(_extract_project(archive, folder, members_by_folder[folder]))
        return result


def mark_duplicates(entries, db, Project):
    """Mark exact-content duplicates and title conflicts in the preview."""
    existing = db.query(Project).all()
    titles = {" ".join((item.title or "").casefold().split()) for item in existing}
    fingerprints = {project_fingerprint({
        "title": item.title,
        "abstract": item.abstract,
        "description": item.description,
        "category": item.category,
        "academic_year": item.academic_year,
        "team_name": item.team_name,
        "report_text": item.report_text,
        "source_code": item.source_code,
        "keywords": item.keywords,
    }) for item in existing}
    seen_titles = set(titles)
    seen_fingerprints = set(fingerprints)
    for entry in entries:
        if not entry.get("valid"):
            continue
        project = entry["project"]
        title_key = " ".join(project["title"].casefold().split())
        fingerprint = entry["fingerprint"]
        if fingerprint in seen_fingerprints:
            entry.update(duplicate=True, duplicate_reason="This project’s content is already in the repository.")
        elif title_key in seen_titles:
            entry.update(duplicate=True, duplicate_reason="A project with this title is already in the repository.")
        else:
            entry.update(duplicate=False, duplicate_reason="")
        seen_titles.add(title_key)
        seen_fingerprints.add(fingerprint)
    return entries


def public_preview(entries):
    return [
        {
            "folder": item["folder"],
            "valid": item["valid"],
            "error": item.get("error", ""),
            "title": item.get("project", {}).get("title", item["folder"]),
            "category": item.get("project", {}).get("category", ""),
            "abstract": item.get("project", {}).get("abstract", "")[:240],
            "files_read": item.get("files_read", 0),
            "duplicate": item.get("duplicate", False),
            "duplicate_reason": item.get("duplicate_reason", ""),
        }
        for item in entries
    ]
