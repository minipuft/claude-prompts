import { describe, expect, it } from '@jest/globals';

import { parseSkillMd, hasNunjucksControlFlow } from '../../../src/modules/skills-sync/service.js';

// ─── parseSkillMd: Order-aware section boundary ─────────────────────────────

describe('parseSkillMd — order-aware section boundaries', () => {
  const wrapSkillMd = (body: string) => `---\nname: Test\ndescription: Test skill\n---\n${body}`;

  it('treats ## Instructions inside ## Usage as content, not a boundary', () => {
    const content = wrapSkillMd(
      `## Arguments\n\n- \`$0\` — **target** (required): The target\n\n` +
        `## Usage\n\nReview the following:\n\n**Target**: {target}\n\n` +
        `## Instructions\n\n1. Execute the tool\n2. Report results\n\n` +
        `## Expected Workflow\n\nBefore committing, ensure:\n- [ ] Tests pass`
    );

    const parsed = parseSkillMd(content);

    // ## Instructions after ## Usage should be content of Usage, not a new section
    expect(parsed.userMessage).toContain('## Instructions');
    expect(parsed.userMessage).toContain('Execute the tool');
    expect(parsed.userMessage).toContain('Expected Workflow');
    // Instructions section should NOT be separately parsed (it's inside Usage)
    expect(parsed.systemMessage).toBeNull();
  });

  it('splits normal section order correctly', () => {
    const content = wrapSkillMd(
      `## Instructions\n\nYou are a reviewer.\n\n## Review Depth\n\n- Surface\n- Deep\n\n` +
        `## Arguments\n\n- \`$0\` — **target** (required): File path\n\n` +
        `## Usage\n\nReview: {target}`
    );

    const parsed = parseSkillMd(content);

    expect(parsed.systemMessage).toContain('You are a reviewer');
    // Sub-heading ## Review Depth is content of Instructions
    expect(parsed.systemMessage).toContain('Review Depth');
    expect(parsed.userMessage).toContain('Review: {target}');
    expect(parsed.arguments).toHaveLength(1);
    expect(parsed.arguments[0]!.name).toBe('target');
  });

  it('handles missing sections without breaking order logic', () => {
    // No Instructions section — jumps straight to Arguments then Usage
    const content = wrapSkillMd(
      `## Arguments\n\n- \`$0\` — **target** (required): File path\n\n` +
        `## Usage\n\nRun the tool with {target}`
    );

    const parsed = parseSkillMd(content);

    expect(parsed.systemMessage).toBeNull();
    expect(parsed.userMessage).toContain('Run the tool');
    expect(parsed.arguments).toHaveLength(1);
  });

  it('handles ## Quality Gates between ## Arguments and ## Usage', () => {
    const content = wrapSkillMd(
      `## Instructions\n\nBe thorough.\n\n` +
        `## Arguments\n\n- \`$0\` — **target** (required): Target\n\n` +
        `## Quality Gates\n\n### Criteria\n\n| Gate | Type |\n|------|------|\n| code-quality | validation |\n\n` +
        `## Usage\n\nReview {target}`
    );

    const parsed = parseSkillMd(content);

    expect(parsed.systemMessage).toContain('Be thorough');
    expect(parsed.userMessage).toContain('Review {target}');
    expect(parsed.qualityGates).toHaveLength(1);
  });
});

// ─── hasNunjucksControlFlow ─────────────────────────────────────────────────

describe('hasNunjucksControlFlow', () => {
  it('detects {% if %} blocks', () => {
    expect(hasNunjucksControlFlow('{% if project_path %}content{% endif %}')).toBe(true);
  });

  it('detects {%- if %} (whitespace-trimming variant)', () => {
    expect(hasNunjucksControlFlow('{%- if skip_tests %}content{% endif %}')).toBe(true);
  });

  it('detects {% for %} loops', () => {
    expect(hasNunjucksControlFlow('{% for item in items %}{{ item }}{% endfor %}')).toBe(true);
  });

  it('detects {% macro %} definitions', () => {
    expect(hasNunjucksControlFlow('{% macro render(x) %}{{ x }}{% endmacro %}')).toBe(true);
  });

  it('detects {% set %} assignments', () => {
    expect(hasNunjucksControlFlow('{% set name = "value" %}')).toBe(true);
  });

  it('does NOT flag simple {{ variable }} references', () => {
    expect(hasNunjucksControlFlow('Hello {{ name }}, welcome to {{ place }}')).toBe(false);
  });

  it('does NOT flag plain text without any Nunjucks', () => {
    expect(hasNunjucksControlFlow('Just plain text with no templates')).toBe(false);
  });

  it('does NOT flag curly braces in code blocks', () => {
    expect(hasNunjucksControlFlow('```\nconst obj = { if: true };\n```')).toBe(false);
  });
});
