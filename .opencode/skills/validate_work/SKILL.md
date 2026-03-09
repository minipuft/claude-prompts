---
name: Validate Work
description: >-
  Run validation commands and check workflow compliance before commits. Reports typecheck, lint, test status and
  coverage delta.
license: MIT
compatibility:
  agent-skills: 1.0.0
metadata:
  resource-type: prompt
  source-hash: e8d71327848ccbf5d92c127d05f60906fcb02762347513a536f1d1a2aa323d50
  category: development
---

## Arguments

- **project_path**: Path to project root (defaults to current directory)
- **fix**: Attempt to auto-fix lint issues
- **verbose**: Show detailed command output
- **skip_tests**: Skip test execution (faster, less thorough)

## Usage

# Workflow Validation Report

Run the `validator` tool to check workflow compliance.

## Validation Scope

**Project**: {project_path}

**Mode**: Quick (skipping tests)

## Instructions

1. Execute the validator tool with the provided options
2. Review the results and report:
   - **Checks**: Status of typecheck, lint, and tests
   - **Warnings**: Any workflow compliance issues detected
   - **Recommendations**: Suggested actions if validation fails

## Expected Workflow

Before committing, ensure:
- [ ] TypeScript compiles without errors
- [ ] Lint passes (or violations haven't increased)
- [ ] Tests pass
- [ ] Coverage hasn't decreased significantly
- [ ] Large source changes have corresponding test changes

If any check fails, address the issue before proceeding.
