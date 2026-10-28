import io
import json
import zipfile

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.main import analysis_payload, preview_import_data, rank_project_candidates, remove_imported_project, save_imported_projects
from app.models import Analysis, AnalysisSearchSummary, ImportedProjectSource, Project, SimilarityResult


def make_archive(title="Reference Library", abstract="A library app for managing books and student loans."):
    content = io.BytesIO()
    with zipfile.ZipFile(content, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("Library/project.json", json.dumps({
            "title": title,
            "abstract": abstract,
            "category": "Web Development",
            "keywords": ["library", "loans"],
        }))
        archive.writestr("Library/README.md", "A library app for managing books and student loans.")
        archive.writestr("Library/src/library.py", "def borrow(book): return book")
    return content.getvalue()


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    yield session
    session.close()
    engine.dispose()


def test_preview_does_not_save_and_reports_ready_projects(db):
    result = preview_import_data(make_archive(), db)

    assert result["ready_count"] == 1
    assert result["duplicate_count"] == 0
    assert result["invalid_count"] == 0
    assert db.query(Project).count() == 0


def test_import_saves_projects_and_marks_them_as_imported(db):
    result = save_imported_projects(make_archive(), "references.zip", db)

    assert result["imported_count"] == 1
    assert result["imported_titles"] == ["Reference Library"]
    project = db.query(Project).one()
    marker = db.get(ImportedProjectSource, project.id)
    assert marker.archive_name == "references.zip"


def test_same_title_and_same_evidence_is_skipped_as_duplicate(db):
    save_imported_projects(make_archive(), "references.zip", db)
    result = save_imported_projects(make_archive(), "second.zip", db)

    assert result["imported_count"] == 0
    assert result["duplicate_count"] == 1
    assert db.query(Project).count() == 1


def test_same_evidence_with_different_title_is_still_detected(db):
    save_imported_projects(make_archive(), "references.zip", db)
    preview = preview_import_data(make_archive(title="Another Name"), db)

    assert preview["ready_count"] == 0
    assert preview["duplicate_count"] == 1


def test_imported_projects_are_included_in_candidate_search(db, monkeypatch):
    monkeypatch.setenv("OLLAMA_ENABLED", "false")
    save_imported_projects(make_archive(), "references.zip", db)
    searched, ranked = rank_project_candidates({
        "title": "Reference Library",
        "abstract": "A library app for managing books and student loans.",
        "description": "",
        "keywords": [],
        "report_text": "",
        "source_code": "",
    }, db)

    assert searched == 1
    assert ranked[0][0].title == "Reference Library"
    analysis = Analysis(title="Search count test")
    db.add(analysis)
    db.flush()
    db.add(AnalysisSearchSummary(analysis_id=analysis.id, candidates_searched=searched))
    db.add(SimilarityResult(analysis_id=analysis.id, project_id=ranked[0][0].id, rank=1, **ranked[0][1]))
    db.commit()
    payload = analysis_payload(analysis, db)
    assert payload["candidates_searched"] == 1
    assert payload["results"][0]["project"]["title"] == "Reference Library"


def test_imported_project_can_be_removed_when_unused(db):
    save_imported_projects(make_archive(), "references.zip", db)
    project = db.query(Project).one()

    remove_imported_project(project.id, db)

    assert db.query(Project).count() == 0
    assert db.query(ImportedProjectSource).count() == 0


def test_imported_project_used_by_a_saved_result_cannot_be_removed(db):
    save_imported_projects(make_archive(), "references.zip", db)
    project = db.query(Project).one()
    analysis = Analysis(title="Test review")
    db.add(analysis)
    db.flush()
    db.add(SimilarityResult(
        analysis_id=analysis.id,
        project_id=project.id,
        rank=1,
        score=0.9,
        classification="Very High Similarity",
        components={},
        shared_keywords=[],
        evidence=[],
    ))
    db.commit()

    with pytest.raises(HTTPException) as error:
        remove_imported_project(project.id, db)

    assert error.value.status_code == 409
    assert db.get(Project, project.id) is not None
