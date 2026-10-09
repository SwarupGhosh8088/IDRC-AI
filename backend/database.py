
from pathlib import Path
import sqlite3
from contextlib import contextmanager

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "seva_command.db"


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_text TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT 'manual',
                incident_type TEXT NOT NULL DEFAULT 'unknown',
                location TEXT NOT NULL DEFAULT 'unknown',
                people_affected INTEGER,
                needs_json TEXT NOT NULL DEFAULT '[]',
                urgency TEXT NOT NULL DEFAULT 'unknown',
                status TEXT NOT NULL DEFAULT 'open',
                verification_status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS resources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                resource_type TEXT NOT NULL,
                quantity_available INTEGER NOT NULL DEFAULT 0,
                unit TEXT NOT NULL DEFAULT 'units',
                location TEXT NOT NULL DEFAULT 'unknown',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)


@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
