"""
SQLite reader for Claude Code hooks.
Queries resource_index table from state.db as a read-only data source.

Replaces JSON cache file reads for prompts and gates.
Uses stdlib sqlite3 — no external dependencies.
"""

import json
import os
import sqlite3

from workspace import get_state_db_path


def _connect_readonly() -> sqlite3.Connection | None:
    """Open a read-only connection to state.db."""
    db_path = get_state_db_path()
    if not db_path:
        return None
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error:
        return None


def load_prompts() -> dict | None:
    """
    Load all prompts from resource_index with metadata.

    Returns a dict with structure:
    {
        "prompts": { id: PromptInfo, ... },
        "_meta": { "valid_styles": [...], "valid_frameworks": [...] }
    }
    """
    conn = _connect_readonly()
    if not conn:
        return None

    try:
        cursor = conn.execute(
            "SELECT id, name, category, description, metadata_json FROM resource_index WHERE type = 'prompt'"
        )
        prompts = {}
        for row in cursor:
            meta = _parse_metadata(row["metadata_json"])
            prompts[row["id"]] = {
                "id": row["id"],
                "name": row["name"] or "",
                "category": row["category"] or "",
                "description": row["description"] or "",
                "is_chain": meta.get("is_chain", False),
                "chain_steps": meta.get("chain_steps", 0),
                "chain_step_ids": meta.get("chain_step_ids"),
                "chain_step_names": meta.get("chain_step_names"),
                "arguments": meta.get("arguments", []),
                "gates": meta.get("gates", []),
                "keywords": meta.get("keywords", []),
            }

        result = {
            "prompts": prompts,
            "_meta": {
                "valid_styles": get_valid_styles_from_db(conn),
                "valid_frameworks": get_valid_frameworks_from_db(conn),
            },
        }
        return result
    except sqlite3.Error:
        return None
    finally:
        conn.close()


def get_prompt_by_id_from_db(prompt_id: str) -> dict | None:
    """Get a single prompt by ID (case-insensitive)."""
    conn = _connect_readonly()
    if not conn:
        return None

    try:
        cursor = conn.execute(
            "SELECT id, name, category, description, metadata_json "
            "FROM resource_index WHERE type = 'prompt' AND LOWER(id) = ?",
            (prompt_id.lower(),),
        )
        row = cursor.fetchone()
        if not row:
            return None

        meta = _parse_metadata(row["metadata_json"])
        return {
            "id": row["id"],
            "name": row["name"] or "",
            "category": row["category"] or "",
            "description": row["description"] or "",
            "is_chain": meta.get("is_chain", False),
            "chain_steps": meta.get("chain_steps", 0),
            "chain_step_ids": meta.get("chain_step_ids"),
            "chain_step_names": meta.get("chain_step_names"),
            "arguments": meta.get("arguments", []),
            "gates": meta.get("gates", []),
            "keywords": meta.get("keywords", []),
        }
    except sqlite3.Error:
        return None
    finally:
        conn.close()


def load_gates() -> dict | None:
    """
    Load all gates from resource_index with metadata.

    Returns a dict with structure:
    { "gates": { id: GateInfo, ... } }
    """
    conn = _connect_readonly()
    if not conn:
        return None

    try:
        cursor = conn.execute("SELECT id, name, description, metadata_json FROM resource_index WHERE type = 'gate'")
        gates = {}
        for row in cursor:
            meta = _parse_metadata(row["metadata_json"])
            gates[row["id"]] = {
                "id": row["id"],
                "name": row["name"] or "",
                "type": meta.get("type", "validation"),
                "description": row["description"] or "",
                "triggers": meta.get("triggers", []),
            }

        return {"gates": gates}
    except sqlite3.Error:
        return None
    finally:
        conn.close()


def get_valid_styles_from_db(conn: sqlite3.Connection | None = None) -> list[str]:
    """Get valid style IDs from resource_index."""
    should_close = False
    if conn is None:
        conn = _connect_readonly()
        should_close = True
    if not conn:
        return []

    try:
        cursor = conn.execute("SELECT LOWER(id) as id FROM resource_index WHERE type = 'style' ORDER BY id")
        return [row["id"] for row in cursor]
    except sqlite3.Error:
        return []
    finally:
        if should_close:
            conn.close()


def get_valid_frameworks_from_db(conn: sqlite3.Connection | None = None) -> list[str]:
    """Get valid framework/methodology IDs from resource_index."""
    should_close = False
    if conn is None:
        conn = _connect_readonly()
        should_close = True
    if not conn:
        return []

    try:
        cursor = conn.execute("SELECT LOWER(id) as id FROM resource_index WHERE type = 'methodology' ORDER BY id")
        return [row["id"] for row in cursor]
    except sqlite3.Error:
        return []
    finally:
        if should_close:
            conn.close()


def _is_pid_alive(pid: int) -> bool:
    """Check if a process is alive via kill(pid, 0)."""
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False


def load_active_chain_state() -> dict | None:
    """Load active chain session state from server's chain_sessions table (SSOT).

    Queries per-row chain_sessions table where tenant_id = server PID.
    Only returns sessions belonging to a live server process, preventing
    cross-client contamination when multiple Claude Code instances share
    the same MCP server's state.db.

    Falls back to chain_run_registry blob if chain_sessions has no rows
    (backward compatibility during rollout).
    """
    conn = _connect_readonly()
    if not conn:
        return None
    try:
        # Primary: query per-row chain_sessions table with PID liveness check
        result = _load_from_session_table(conn)
        if result is not None:
            return result

        # Fallback: legacy chain_run_registry blob (pre-PID isolation)
        return _load_from_run_registry(conn)
    except (sqlite3.Error, json.JSONDecodeError, KeyError, TypeError):
        return None
    finally:
        conn.close()


def _load_from_session_table(conn: sqlite3.Connection) -> dict | None:
    """Query chain_sessions per-row table. Returns session for a live PID, or None."""
    try:
        cursor = conn.execute("SELECT tenant_id, chain_id, state FROM chain_sessions ORDER BY updated_at DESC")
        rows = cursor.fetchall()
    except sqlite3.OperationalError:
        return None

    if not rows:
        return None

    for row in rows:
        pid_str = row["tenant_id"]
        try:
            pid = int(pid_str)
        except (ValueError, TypeError):
            continue
        if not _is_pid_alive(pid):
            continue

        state_json = row["state"]
        if not state_json:
            continue

        session = json.loads(state_json)
        return _session_to_hook_state(session)

    return None


def _load_from_run_registry(conn: sqlite3.Connection) -> dict | None:
    """Fallback: read from PID-scoped chain_run_registry blob rows."""
    try:
        cursor = conn.execute("SELECT tenant_id, state FROM chain_run_registry")
        rows = cursor.fetchall()
    except sqlite3.OperationalError:
        return None

    if not rows:
        return None

    best = None
    best_activity = 0

    for row in rows:
        tenant_id = row["tenant_id"]
        # Only read blobs from live server processes
        try:
            pid = int(tenant_id)
        except (ValueError, TypeError):
            continue
        if not _is_pid_alive(pid):
            continue

        state_json = row["state"]
        if not state_json:
            continue

        registry = json.loads(state_json)
        runs = registry.get("runs", {})

        for session in runs.values():
            if not isinstance(session, dict):
                continue
            if session.get("lifecycle") == "dormant":
                continue
            activity = session.get("lastActivity", 0)
            if activity > best_activity:
                best = session
                best_activity = activity

    if not best:
        return None

    return _session_to_hook_state(best)


def _session_to_hook_state(session: dict) -> dict | None:
    """Convert a chain session dict to the hook ChainState shape."""
    current = session.get("currentStep", 0)
    total = session.get("totalSteps", 0)

    # Also check nested state (chain_run_registry format)
    if current == 0 and total == 0:
        chain_state = session.get("state", {})
        if isinstance(chain_state, dict):
            current = chain_state.get("currentStep", 0)
            total = chain_state.get("totalSteps", 0)

    has_pending_review = bool(session.get("pendingGateReview"))
    has_pending_verify = bool(session.get("pendingShellVerification"))
    in_progress = current > 0 and current < total
    pending_at_final = current > 0 and current == total and (has_pending_review or has_pending_verify)

    if not in_progress and not pending_at_final:
        return None

    result = {
        "chain_id": session.get("chainId", session.get("chain_id", "")),
        "current_step": current,
        "total_steps": total,
        "pending_gate": None,
        "gate_criteria": [],
        "last_prompt_id": "",
        "pending_shell_verify": None,
        "shell_verify_attempts": 0,
    }

    gate_review = session.get("pendingGateReview")
    if gate_review and isinstance(gate_review, dict):
        gate_ids = gate_review.get("gateIds", [])
        if gate_ids:
            result["pending_gate"] = ", ".join(gate_ids)
        result["shell_verify_attempts"] = gate_review.get("attemptCount", 0)

    shell_verify = session.get("pendingShellVerification")
    if shell_verify and isinstance(shell_verify, dict):
        cmd_info = shell_verify.get("shellVerify", {})
        result["pending_shell_verify"] = cmd_info.get("command")
        result["shell_verify_attempts"] = shell_verify.get("attemptCount", 0)

    return result


def _parse_metadata(metadata_json: str | None) -> dict:
    """Parse metadata_json column, returning empty dict on failure."""
    if not metadata_json:
        return {}
    try:
        return json.loads(metadata_json)
    except (json.JSONDecodeError, TypeError):
        return {}
