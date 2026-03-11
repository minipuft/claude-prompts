"""
Tests for hooks/lib/session_tracker.py

Covers:
- SessionTracker creation and state initialization
- Iteration recording
- File change tracking
- Story generation
- Diff summary
- Subagent result tracking
- Memory file creation
- Session clearing
"""

import sys
from pathlib import Path

HOOKS_LIB = Path(__file__).parent.parent / "lib"
sys.path.insert(0, str(HOOKS_LIB))


class TestSessionTracker:
    def test_creates_session_directory(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-session-001")
        assert tracker.session_dir.exists()
        assert tracker.session_dir.name == "test-session-001"

    def test_creates_memory_files(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-session-002")
        assert tracker.run_memory_file.exists()
        assert tracker.loop_memory_file.exists()
        assert "Ralph Run Memory" in tracker.run_memory_file.read_text()
        assert "Ralph Loop Memory" in tracker.loop_memory_file.read_text()

    def test_initial_state(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-session-003")
        assert tracker.state["session_id"] == "test-session-003"
        assert tracker.state["original_goal"] == ""
        assert tracker.state["iterations"] == []
        assert tracker.state["file_changes"] == {}
        assert tracker.state["subagent_results"] == []

    def test_set_goal(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-goal")
        tracker.set_goal(
            goal="Fix authentication bug",
            verification_command="npm test",
            working_directory="/home/user/project",
        )
        assert tracker.state["original_goal"] == "Fix authentication bug"
        assert tracker.state["verification_command"] == "npm test"
        assert tracker.state["working_directory"] == "/home/user/project"

    def test_record_iteration(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-iter")
        tracker.record_iteration(
            approach="Tried fixing the import",
            result="FAIL - module not found",
            lesson="Need to update package.json first",
        )
        assert len(tracker.state["iterations"]) == 1
        it = tracker.state["iterations"][0]
        assert it["number"] == 1
        assert it["approach"] == "Tried fixing the import"
        assert it["result"] == "FAIL - module not found"

    def test_record_multiple_iterations(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-multi-iter")
        tracker.record_iteration("First try", "FAIL", "Wrong approach")
        tracker.record_iteration("Second try", "FAIL", "Getting closer")
        tracker.record_iteration("Third try", "PASS", "Fixed it")
        assert len(tracker.state["iterations"]) == 3
        assert tracker.state["iterations"][2]["number"] == 3

    def test_record_file_change(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-file-change")
        tracker.record_file_change(
            file_path="src/auth.ts",
            change_type="modify",
            details="Fixed import statement",
        )
        assert "src/auth.ts" in tracker.state["file_changes"]
        assert len(tracker.state["file_changes"]["src/auth.ts"]) == 1

    def test_record_subagent_result(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-subagent")
        tracker.record_subagent_result(
            agent_type="chain-executor",
            summary="Applied fix to auth module",
        )
        assert len(tracker.state["subagent_results"]) == 1
        assert tracker.state["subagent_results"][0]["agent_type"] == "chain-executor"

    def test_generate_story_no_iterations(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-story-empty")
        story = tracker.generate_story()
        assert "No iterations" in story

    def test_generate_story_with_iterations(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-story")
        tracker.set_goal("Fix the bug", "npm test")
        tracker.record_iteration("First try", "FAIL", "Wrong approach")
        tracker.record_iteration("Second try", "PASS", "Correct fix")
        story = tracker.generate_story()
        assert "Fix the bug" in story
        assert "First try" in story
        assert "Second try" in story
        assert "Iteration 1" in story
        assert "Iteration 2" in story

    def test_generate_diff_summary_empty(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-diff-empty")
        summary = tracker.generate_diff_summary()
        assert "No file changes" in summary

    def test_generate_diff_summary_with_changes(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-diff")
        tracker.record_file_change("src/auth.ts", "modify", "Fixed import")
        tracker.record_file_change("src/auth.ts", "modify", "Added validation")
        tracker.record_file_change("src/test.ts", "add", "New test file")
        summary = tracker.generate_diff_summary()
        assert "src/auth.ts" in summary
        assert "src/test.ts" in summary
        assert "```diff" in summary

    def test_append_run_memory(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-run-mem")
        tracker.append_run_memory("Found the root cause")
        content = tracker.run_memory_file.read_text()
        assert "Found the root cause" in content

    def test_append_loop_memory(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-loop-mem")
        tracker.append_loop_memory("Iteration 3 delegated to sub-agent")
        content = tracker.loop_memory_file.read_text()
        assert "Iteration 3 delegated" in content

    def test_append_empty_memory_is_noop(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-empty-mem")
        initial = tracker.run_memory_file.read_text()
        tracker.append_run_memory("")
        tracker.append_run_memory("   ")
        assert tracker.run_memory_file.read_text() == initial

    def test_get_iteration_count(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-count")
        assert tracker.get_iteration_count() == 0
        tracker.record_iteration("Try 1", "FAIL", "Lesson 1")
        assert tracker.get_iteration_count() == 1
        tracker.record_iteration("Try 2", "PASS", "Lesson 2")
        assert tracker.get_iteration_count() == 2

    def test_clear_session(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-clear")
        tracker.set_goal("Test goal", "npm test")
        tracker.record_iteration("Try", "FAIL", "Lesson")
        tracker.clear()

        # State should be cleared from SQLite
        from hook_state_store import TABLE_RALPH_SESSION_STATE, load_state
        state = load_state(TABLE_RALPH_SESSION_STATE, "test-clear")
        assert state is None

    def test_state_persistence_across_instances(self, patch_workspace):
        from session_tracker import SessionTracker

        # First instance creates state
        tracker1 = SessionTracker("test-persist")
        tracker1.set_goal("Fix auth", "npm test")
        tracker1.record_iteration("First try", "FAIL", "Wrong approach")

        # Second instance loads same state
        tracker2 = SessionTracker("test-persist")
        assert tracker2.state["original_goal"] == "Fix auth"
        assert len(tracker2.state["iterations"]) == 1

    def test_generate_task_context(self, patch_workspace):
        from session_tracker import SessionTracker

        tracker = SessionTracker("test-context")
        tracker.set_goal("Fix login bug", "npm test")
        tracker.record_iteration("Tried X", "FAIL", "X didn't work")
        tracker.record_file_change("src/login.ts", "modify", "Changed import")

        context = tracker.generate_task_context(last_failure_output="Error: test failed")
        assert "## Original Goal" in context
        assert "Fix login bug" in context
        assert "## Session Story" in context
        assert "## Last Failure" in context
        assert "Error: test failed" in context
        assert "## What To Try Next" in context
        assert "## Instructions" in context


class TestGetSessionTracker:
    def test_factory_function(self, patch_workspace):
        from session_tracker import get_session_tracker

        tracker = get_session_tracker("factory-test")
        assert isinstance(tracker, object)
        assert tracker.session_id == "factory-test"


class TestClearRalphSession:
    def test_clears_session(self, patch_workspace):
        from session_tracker import SessionTracker, clear_ralph_session

        tracker = SessionTracker("clear-test")
        tracker.set_goal("Test", "echo test")
        clear_ralph_session("clear-test")

        from hook_state_store import TABLE_RALPH_SESSION_STATE, load_state
        assert load_state(TABLE_RALPH_SESSION_STATE, "clear-test") is None
