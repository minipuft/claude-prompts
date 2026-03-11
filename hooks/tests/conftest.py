"""
Shared pytest fixtures for hook tests.

Provides:
- Temporary workspace/runtime-state isolation
- Mock transcript builders
- Workspace environment patching
"""

import json
import sys
from pathlib import Path

import pytest

# Ensure hooks/lib is importable
HOOKS_LIB = Path(__file__).parent.parent / "lib"
if str(HOOKS_LIB) not in sys.path:
    sys.path.insert(0, str(HOOKS_LIB))


@pytest.fixture
def tmp_workspace(tmp_path):
    """Create an isolated workspace with runtime-state directory structure."""
    workspace = tmp_path / "workspace"
    server_dir = workspace / "server"
    runtime_dir = workspace / "runtime-state"
    ralph_sessions = runtime_dir / "ralph-sessions"

    server_dir.mkdir(parents=True)
    runtime_dir.mkdir(parents=True)
    ralph_sessions.mkdir(parents=True)

    return {
        "root": workspace,
        "server": server_dir,
        "runtime_state": runtime_dir,
        "ralph_sessions": ralph_sessions,
    }


@pytest.fixture
def patch_workspace(tmp_workspace, monkeypatch):
    """Patch workspace resolution to use tmp_workspace."""
    monkeypatch.setenv("MCP_WORKSPACE", str(tmp_workspace["root"]))
    return tmp_workspace


@pytest.fixture
def transcript_builder(tmp_path):
    """Build JSONL transcript files for testing subagent-gate-enforce."""

    class TranscriptBuilder:
        def __init__(self):
            self.messages = []
            self.path = tmp_path / "transcript.jsonl"

        def add_human(self, content):
            self.messages.append({"type": "human", "content": content})
            return self

        def add_human_blocks(self, blocks):
            """Add human message with content as list of blocks."""
            self.messages.append({"type": "human", "content": blocks})
            return self

        def add_assistant(self, content):
            self.messages.append({"type": "assistant", "content": content})
            return self

        def add_assistant_blocks(self, blocks):
            """Add assistant message with content as list of blocks."""
            self.messages.append({"type": "assistant", "content": blocks})
            return self

        def write(self, path=None):
            target = path or self.path
            with open(target, "w") as f:
                for msg in self.messages:
                    f.write(json.dumps(msg) + "\n")
            return str(target)

        def write_corrupt(self, path=None):
            """Write a corrupt (non-JSON) transcript."""
            target = path or self.path
            with open(target, "w") as f:
                f.write("not json at all\n")
                f.write("{broken\n")
            return str(target)

    return TranscriptBuilder()
