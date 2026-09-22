"""SQLite persistence for Expensomanaga."""
from __future__ import annotations

import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import date
from typing import Any

from backend.seed import seed_transactions

DEFAULT_SETTINGS = {"defaultExpenseAccount": "main"}


def _db_path() -> str:
    data_dir = os.environ.get("EXPENSO_DATA_DIR", "data")
    os.makedirs(data_dir, exist_ok=True)
    return os.path.join(data_dir, "expensomanaga.db")


@contextmanager
def connect():
    conn = sqlite3.connect(_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS transactions (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL,
              description TEXT NOT NULL,
              amount REAL NOT NULL,
              type TEXT NOT NULL,
              category TEXT NOT NULL,
              account TEXT NOT NULL,
              from_account TEXT NOT NULL DEFAULT 'main',
              to_account TEXT NOT NULL DEFAULT 'savings'
            );
            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS goals (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              target REAL NOT NULL,
              track TEXT NOT NULL,
              deadline TEXT,
              saved_amount REAL NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS custom_categories (
              id TEXT PRIMARY KEY,
              label TEXT NOT NULL,
              phosphor TEXT NOT NULL,
              type TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS meta (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            """
        )
        row = conn.execute("SELECT value FROM meta WHERE key = 'initialized'").fetchone()
        if not row:
            for tx in seed_transactions():
                _insert_transaction(conn, tx)
            for key, value in DEFAULT_SETTINGS.items():
                conn.execute(
                    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
                    (key, json.dumps(value)),
                )
            conn.execute(
                "INSERT INTO meta (key, value) VALUES ('initialized', '1')"
            )


def _row_to_tx(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "date": row["date"],
        "description": row["description"],
        "amount": float(row["amount"]),
        "type": row["type"],
        "category": row["category"],
        "account": row["account"],
        "fromAccount": row["from_account"],
        "toAccount": row["to_account"],
    }


def _insert_transaction(conn: sqlite3.Connection, tx: dict[str, Any]) -> dict[str, Any]:
    tx_id = tx.get("id") or str(uuid.uuid4())
    record = {
        "id": tx_id,
        "date": tx["date"],
        "description": tx["description"],
        "amount": float(tx["amount"]),
        "type": tx["type"],
        "category": tx["category"],
        "account": tx.get("account") or "main",
        "fromAccount": tx.get("fromAccount") or tx.get("account") or "main",
        "toAccount": tx.get("toAccount") or "savings",
    }
    conn.execute(
        """
        INSERT INTO transactions
          (id, date, description, amount, type, category, account, from_account, to_account)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record["id"],
            record["date"],
            record["description"],
            record["amount"],
            record["type"],
            record["category"],
            record["account"],
            record["fromAccount"],
            record["toAccount"],
        ),
    )
    return record


def list_transactions() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM transactions ORDER BY date DESC, rowid DESC"
        ).fetchall()
        return [_row_to_tx(r) for r in rows]


def create_transaction(partial: dict[str, Any]) -> dict[str, Any]:
    with connect() as conn:
        return _insert_transaction(conn, partial)


def update_transaction(tx_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    current = get_transaction(tx_id)
    if not current:
        return None
    merged = {**current, **updates, "id": tx_id}
    with connect() as conn:
        conn.execute(
            """
            UPDATE transactions SET
              date = ?, description = ?, amount = ?, type = ?, category = ?,
              account = ?, from_account = ?, to_account = ?
            WHERE id = ?
            """,
            (
                merged["date"],
                merged["description"],
                float(merged["amount"]),
                merged["type"],
                merged["category"],
                merged["account"],
                merged.get("fromAccount", merged["account"]),
                merged.get("toAccount", "savings"),
                tx_id,
            ),
        )
    return merged


def delete_transaction(tx_id: str) -> bool:
    with connect() as conn:
        cur = conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
        return cur.rowcount > 0


def get_transaction(tx_id: str) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
        return _row_to_tx(row) if row else None


def bulk_import(items: list[dict[str, Any]], mode: str = "merge") -> list[dict[str, Any]]:
    with connect() as conn:
        if mode == "replace":
            conn.execute("DELETE FROM transactions")
        existing = set()
        if mode == "merge":
            existing = {r["id"] for r in conn.execute("SELECT id FROM transactions").fetchall()}
        inserted: list[dict[str, Any]] = []
        for item in items:
            if mode == "merge" and item.get("id") in existing:
                continue
            inserted.append(_insert_transaction(conn, item))
    return list_transactions()


def reset_all() -> None:
    with connect() as conn:
        conn.execute("DELETE FROM transactions")
        conn.execute("DELETE FROM goals")
        conn.execute("DELETE FROM custom_categories")
        conn.execute("DELETE FROM settings")
        conn.execute("DELETE FROM meta")
    init_db()


def get_settings() -> dict[str, Any]:
    with connect() as conn:
        rows = conn.execute("SELECT key, value FROM settings").fetchall()
        settings = dict(DEFAULT_SETTINGS)
        for row in rows:
            settings[row["key"]] = json.loads(row["value"])
        return settings


def save_settings(patch: dict[str, Any]) -> dict[str, Any]:
    current = get_settings()
    next_settings = {**current, **patch}
    with connect() as conn:
        for key, value in patch.items():
            conn.execute(
                """
                INSERT INTO settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, json.dumps(value)),
            )
    return next_settings


def list_goals() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM goals ORDER BY created_at DESC").fetchall()
        return [
            {
                "id": r["id"],
                "name": r["name"],
                "target": float(r["target"]),
                "track": r["track"],
                "deadline": r["deadline"],
                "savedAmount": float(r["saved_amount"]),
                "createdAt": r["created_at"],
            }
            for r in rows
        ]


def create_goal(partial: dict[str, Any]) -> dict[str, Any]:
    goal = {
        "id": partial.get("id") or str(uuid.uuid4()),
        "name": partial["name"],
        "target": float(partial["target"]),
        "track": partial.get("track") or "savings",
        "deadline": partial.get("deadline"),
        "savedAmount": float(partial.get("savedAmount") or 0),
        "createdAt": partial.get("createdAt") or date.today().isoformat(),
    }
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO goals (id, name, target, track, deadline, saved_amount, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                goal["id"],
                goal["name"],
                goal["target"],
                goal["track"],
                goal["deadline"],
                goal["savedAmount"],
                goal["createdAt"],
            ),
        )
    return goal


def update_goal(goal_id: str, updates: dict[str, Any]) -> dict[str, Any] | None:
    goals = list_goals()
    current = next((g for g in goals if g["id"] == goal_id), None)
    if not current:
        return None
    merged = {**current, **updates, "id": goal_id}
    with connect() as conn:
        conn.execute(
            """
            UPDATE goals SET name = ?, target = ?, track = ?, deadline = ?, saved_amount = ?
            WHERE id = ?
            """,
            (
                merged["name"],
                float(merged["target"]),
                merged["track"],
                merged["deadline"],
                float(merged.get("savedAmount") or 0),
                goal_id,
            ),
        )
    return merged


def delete_goal(goal_id: str) -> bool:
    with connect() as conn:
        cur = conn.execute("DELETE FROM goals WHERE id = ?", (goal_id,))
        return cur.rowcount > 0


def list_custom_categories() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute("SELECT * FROM custom_categories ORDER BY label").fetchall()
        return [
            {
                "id": r["id"],
                "label": r["label"],
                "phosphor": r["phosphor"],
                "type": r["type"],
                "custom": True,
            }
            for r in rows
        ]


def create_custom_category(partial: dict[str, Any]) -> dict[str, Any]:
    entry = {
        "id": partial.get("id") or f"custom_{uuid.uuid4().hex[:8]}",
        "label": partial["label"].strip(),
        "phosphor": partial.get("phosphor") or "Package",
        "type": partial.get("type") or "expense",
        "custom": True,
    }
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO custom_categories (id, label, phosphor, type)
            VALUES (?, ?, ?, ?)
            """,
            (entry["id"], entry["label"], entry["phosphor"], entry["type"]),
        )
    return entry


def delete_custom_category(category_id: str) -> bool:
    with connect() as conn:
        cur = conn.execute("DELETE FROM custom_categories WHERE id = ?", (category_id,))
        return cur.rowcount > 0


def import_snapshot(snapshot: dict[str, Any]) -> None:
    with connect() as conn:
        if snapshot.get("transactions") is not None:
            conn.execute("DELETE FROM transactions")
            for tx in snapshot["transactions"]:
                _insert_transaction(conn, tx)
        if snapshot.get("settings"):
            for key, value in snapshot["settings"].items():
                conn.execute(
                    """
                    INSERT INTO settings (key, value) VALUES (?, ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value
                    """,
                    (key, json.dumps(value)),
                )
        if snapshot.get("goals") is not None:
            conn.execute("DELETE FROM goals")
            for goal in snapshot["goals"]:
                conn.execute(
                    """
                    INSERT INTO goals (id, name, target, track, deadline, saved_amount, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        goal.get("id") or str(uuid.uuid4()),
                        goal["name"],
                        float(goal["target"]),
                        goal.get("track") or "savings",
                        goal.get("deadline"),
                        float(goal.get("savedAmount") or 0),
                        goal.get("createdAt") or date.today().isoformat(),
                    ),
                )
        if snapshot.get("customCategories") is not None:
            conn.execute("DELETE FROM custom_categories")
            for cat in snapshot["customCategories"]:
                conn.execute(
                    """
                    INSERT INTO custom_categories (id, label, phosphor, type)
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        cat.get("id") or f"custom_{uuid.uuid4().hex[:8]}",
                        cat["label"].strip(),
                        cat.get("phosphor") or "Package",
                        cat.get("type") or "expense",
                    ),
                )
