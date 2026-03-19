#!/usr/bin/env python3
"""
SessionStart hook: Inject skill-first protocol and active skill catalog.

Triggers on: startup, resume (not clear/compact — those have own hooks)

Scans ~/.claude/skills/ for installed skills, categorizes by keyword matching,
and outputs a compact reminder reinforcing skill-first reasoning.
"""

import json
import re
import sys
from pathlib import Path

# Category keywords → matched against skill description frontmatter
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Process": [
        "debug",
        "diagnosis",
        "root cause",
        "fix validation",
        "planning",
        "task breakdown",
        "implementation design",
        "exploration",
        "file discovery",
        "code search",
        "refactor",
        "migration",
        "lifecycle",
        "pre-flight",
        "validation suite",
        "compliance",
        "assessment",
        "tradeoff",
        "quality review",
        "context window",
        "compaction",
        "doom loop",
        "clarification",
        "ambiguous",
        "underspecified",
    ],
    "Architecture": [
        "layer",
        "OOP",
        "FP",
        "dependency injection",
        "module organization",
        "test type",
        "integration-first",
        "Jest",
        "coverage",
        "mock",
        "dead code",
        "consolidation",
        "lint ratchet",
        "architecture enforcement",
        "release",
        "version bump",
        "publish",
        "changelog finalization",
        "rule lifecycle",
        "knowledge placement",
        "glob design",
        "directive style",
        "consumption context",
    ],
    "Languages": [
        "JavaScript",
        "async pattern",
        "module system",
        "runtime quirk",
        "TypeScript",
        "strict typing",
        "generics",
        "type inference",
        "Python",
        "PEP",
        "pytest",
        "type annotation",
        "SQL",
        "query pattern",
        "join",
        "schema design",
        "SQLite",
        "WAL",
        "sql.js",
        "WASM",
        "embedded database",
    ],
    "Tools": [
        "Claude Code",
        "tool selection",
        "agent routing",
        "skill system",
        "hook",
        "MCP server",
        "protocol compliance",
        "tool design",
        "transport",
        "commit convention",
        "branching",
        "safety protocol",
        "git",
        "Playwright",
        "browser automation",
        "screenshot",
        "OpenCode plugin",
        "opencode",
        "Gemini",
        "gemini-extension",
        "Spicetify",
        "Player API",
        "Platform API",
        "theming system",
        "marketplace",
    ],
    "Knowledge": [
        "context7",
        "library documentation",
        "API freshness",
        "drift",
        "pattern capture",
        "growth declaration",
        "knowledge feedback",
        "memory file",
        "MEMORY.md",
        "topic file",
        "changelog entry",
        "Keep a Changelog",
        "Release Please",
        "skill creation",
        "format standard",
        "ecosystem map",
    ],
    "Quality": [
        "code review",
        "standards compliance",
        "consolidation opportunit",
        "diagnose",
        "codebase issue",
        "tech debt",
        "typecheck",
        "lint",
        "test status",
        "coverage delta",
    ],
}


def parse_hook_input() -> dict:
    """Parse JSON input from Claude Code hook system."""
    try:
        return json.load(sys.stdin)
    except json.JSONDecodeError:
        return {}


def read_skill_description(skill_dir: Path) -> str | None:
    """Extract description from SKILL.md YAML frontmatter."""
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        return None

    try:
        content = skill_md.read_text(encoding="utf-8")
    except OSError:
        return None

    # Parse YAML frontmatter between --- markers
    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
    if not match:
        return None

    frontmatter = match.group(1)

    # Try multi-line >- syntax first (most common in our skills)
    desc_match = re.search(
        r"description:\s*>-?\s*\n((?:\s+.*\n)*)",
        frontmatter,
    )
    if desc_match:
        raw = desc_match.group(1).strip()
        if raw:
            return re.sub(r"\s+", " ", raw).strip()

    # Fall back to single-line description
    desc_match = re.search(r"description:\s*(.+)", frontmatter)
    if desc_match:
        raw = desc_match.group(1).strip()
        if raw and not raw.startswith(">"):
            return raw

    return None


def categorize_skill(_name: str, description: str) -> str:
    """Match skill to category by keyword overlap."""
    desc_lower = description.lower()
    best_category = "Other"
    best_score = 0

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in desc_lower)
        if score > best_score:
            best_score = score
            best_category = category

    return best_category


def scan_skills(skills_dir: Path) -> dict[str, list[str]]:
    """Scan skills directory, return categorized skill names."""
    categories: dict[str, list[str]] = {}

    if not skills_dir.is_dir():
        return categories

    for entry in sorted(skills_dir.iterdir()):
        if not entry.is_dir() or entry.name.startswith(".") or entry.name.startswith("_"):
            continue

        description = read_skill_description(entry)
        if not description:
            continue

        category = categorize_skill(entry.name, description)
        categories.setdefault(category, []).append(entry.name)

    return categories


def build_context(categories: dict[str, list[str]]) -> str:
    """Build compact skill-first context string."""
    lines = [
        "Skills-first: invoke /skill BEFORE reasoning from memory. Check → invoke → announce → follow.",
        "",
    ]

    # Category order
    order = ["Process", "Architecture", "Languages", "Tools", "Knowledge", "Quality", "Other"]

    for cat in order:
        skills = categories.get(cat)
        if not skills:
            continue
        skill_list = " ".join(f"/{s}" for s in skills)
        lines.append(f"{cat}: {skill_list}")

    lines.extend(
        [
            "",
            "Priority: process → architecture → language → tool → knowledge",
            "Stacking: /search → route → design → implement → validate → capture",
            'Red flag: "I know this" / "skill is overkill" → STOP, invoke skill',
        ]
    )

    return "\n".join(lines)


def main():
    hook_input = parse_hook_input()
    source = hook_input.get("source", "")

    # Only inject on startup and resume (not clear/compact)
    if source not in ("startup", "resume"):
        sys.exit(0)

    skills_dir = Path.home() / ".claude" / "skills"
    categories = scan_skills(skills_dir)

    if not categories:
        sys.exit(0)

    context = build_context(categories)

    hook_response = {
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": context,
        }
    }
    print(json.dumps(hook_response))
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[Session Skills Hook Error] {e}", file=sys.stderr)
        sys.exit(1)
