
import json
import sqlite3

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_db
from backend.models import IncidentCreate, IncidentUpdate

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


def serialize_incident(row):
    item = dict(row)
    item["needs"] = json.loads(item.pop("needs_json"))
    return item


@router.post("", status_code=201)
def create_incident(payload: IncidentCreate):
    with get_db() as conn:
        cursor = conn.execute(
            """
            INSERT INTO incidents (report_text, source)
            VALUES (?, ?)
            """,
            (payload.report_text, payload.source),
        )
        incident_id = cursor.lastrowid
        conn.commit()

        row = conn.execute(
            "SELECT * FROM incidents WHERE id = ?",
            (incident_id,),
        ).fetchone()

    return {
        "success": True,
        "message": "Incident report saved. AI analysis is pending.",
        "incident": serialize_incident(row),
    }


@router.get("")
def list_incidents(
    urgency: str | None = None,
    status: str | None = None,
    search: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    query = "SELECT * FROM incidents WHERE 1=1"
    params = []

    if urgency:
        query += " AND urgency = ?"
        params.append(urgency)

    if status:
        query += " AND status = ?"
        params.append(status)

    if search:
        query += " AND (report_text LIKE ? OR location LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term])

    query += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()

    return {
        "success": True,
        "count": len(rows),
        "incidents": [serialize_incident(row) for row in rows],
    }


@router.get("/{incident_id}")
def get_incident(incident_id: int):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM incidents WHERE id = ?",
            (incident_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Incident not found")

    return {"success": True, "incident": serialize_incident(row)}


@router.patch("/{incident_id}")
def update_incident(incident_id: int, payload: IncidentUpdate):
    allowed_fields = {
        "incident_type",
        "location",
        "people_affected",
        "needs",
        "urgency",
        "status",
    }
    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(status_code=400, detail="No fields supplied")

    # Human corrections are stored in the same incident record for now.
    # AI output and verified values will be separated in a later iteration.
    values = []
    assignments = []

    for field, value in updates.items():
        if field not in allowed_fields:
            continue

        if field == "needs":
            field = "needs_json"
            value = json.dumps(value)

        assignments.append(f"{field} = ?")
        values.append(value)

    values.append(incident_id)

    with get_db() as conn:
        cursor = conn.execute(
            f"UPDATE incidents SET {', '.join(assignments)} WHERE id = ?",
            values,
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM incidents WHERE id = ?",
            (incident_id,),
        ).fetchone()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Incident not found")

    return {"success": True, "incident": serialize_incident(row)}
