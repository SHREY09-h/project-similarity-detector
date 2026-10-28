import io
import json
import zipfile
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.project_import import mark_duplicates, parse_project_archive


def make_archive(files):
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, content in files.items():
            archive.writestr(name, content)
    return stream.getvalue()


def basic_project(folder="LibraryApp", title="Library App"):
    return {
        f"{folder}/project.json": json.dumps({
            "title": title,
            "abstract": "A college library system for managing books and loans.",
            "description": "Search, borrowing, and return tracking.",
            "category": "Web Development",
            "keywords": ["library", "loans"],
        }),
        f"{folder}/README.md": "# Library App\nA project for managing library books and student loans.",
        f"{folder}/src/app.py": "def borrow_book(book_id):\n    return book_id\n",
    }


def test_parses_project_manifest_readme_and_source_as_text():
    entries = parse_project_archive(make_archive(basic_project()))

    assert len(entries) == 1
    project = entries[0]["project"]
    assert entries[0]["valid"] is True
    assert project["title"] == "Library App"
    assert "managing library books" in project["report_text"]
    assert "def borrow_book" in project["source_code"]
    assert project["keywords"] == ["library", "loans"]


def test_project_without_manifest_is_reported_as_invalid():
    entries = parse_project_archive(make_archive({"MissingManifest/README.md": "Some project notes."}))

    assert entries[0]["valid"] is False
    assert "project.json" in entries[0]["error"]


def test_rejects_malformed_zip():
    with pytest.raises(HTTPException) as error:
        parse_project_archive(b"not a zip archive")
    assert "valid ZIP" in error.value.detail


def test_rejects_empty_zip():
    archive = make_archive({})
    with pytest.raises(HTTPException) as error:
        parse_project_archive(archive)
    assert "project folders" in error.value.detail


def test_rejects_path_traversal_entries():
    archive = make_archive({"LibraryApp/project.json": json.dumps({"title": "Library App"}), "LibraryApp/../escape.py": "bad"})

    with pytest.raises(HTTPException) as error:
        parse_project_archive(archive)
    assert "unsafe file path" in error.value.detail


def test_rejects_files_over_per_file_limit():
    archive = make_archive({**basic_project(), "LibraryApp/src/large.py": "#" * (1024 * 1024 + 1)})

    with pytest.raises(HTTPException) as error:
        parse_project_archive(archive)
    assert "1 MiB" in error.value.detail


def test_marks_existing_titles_as_duplicates():
    entry = parse_project_archive(make_archive(basic_project()))
    existing = SimpleNamespace(
        title="Library App",
        abstract="Older version of the library project.",
        description="",
        category="Web Development",
        academic_year="",
        team_name="",
        report_text="",
        source_code="",
        keywords=[],
    )

    class Query:
        def all(self):
            return [existing]

    class Database:
        def query(self, model):
            return Query()

    marked = mark_duplicates(entry, Database(), object)

    assert marked[0]["duplicate"] is True
    assert "title" in marked[0]["duplicate_reason"]


def test_two_same_title_projects_in_one_zip_only_allow_first():
    files = basic_project("First", "Same Project")
    files.update(basic_project("Second", "Same Project"))

    class Query:
        def all(self):
            return []

    class Database:
        def query(self, model):
            return Query()

    marked = mark_duplicates(parse_project_archive(make_archive(files)), Database(), object)

    assert sum(entry.get("duplicate", False) for entry in marked) == 1
