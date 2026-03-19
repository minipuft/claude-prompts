#!/usr/bin/env node
/**
 * Merges manual [Unreleased] changelog entries into the latest versioned section.
 *
 * Runs as a post-step in the Release Please workflow. After Release Please
 * generates a versioned section from commit messages, this script takes any
 * richer manual entries from [Unreleased] and merges them in by section heading.
 *
 * Usage: node scripts/merge-unreleased-changelog.js [path/to/CHANGELOG.md]
 */

const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = process.argv[2] || path.join(__dirname, '..', 'CHANGELOG.md');

// Section order per changelog-generator skill / Keep a Changelog
const SECTION_ORDER = [
  'Added', 'Changed', 'Deprecated', 'Removed',
  'Fixed', 'Security', 'Improved', 'Documentation',
];

/**
 * Parse a changelog region into { heading: entries[] } map.
 * A "region" is the text between two ## headings.
 */
function parseSections(text) {
  const sections = new Map();
  let currentSection = null;

  for (const line of text.split('\n')) {
    const headingMatch = line.match(/^### (.+)$/);
    if (headingMatch) {
      currentSection = headingMatch[1].trim();
      if (!sections.has(currentSection)) {
        sections.set(currentSection, []);
      }
    } else if (currentSection && line.trim()) {
      sections.get(currentSection).push(line);
    }
  }

  return sections;
}

/**
 * Merge manual entries into versioned entries by section heading.
 * Manual entries are prepended (richer descriptions come first).
 */
function mergeSections(manualSections, versionedSections) {
  const merged = new Map();

  // Start with all versioned sections
  for (const [heading, entries] of versionedSections) {
    merged.set(heading, [...entries]);
  }

  // Merge manual sections in
  for (const [heading, entries] of manualSections) {
    if (merged.has(heading)) {
      // Prepend manual entries before auto-generated ones
      merged.set(heading, [...entries, ...merged.get(heading)]);
    } else {
      merged.set(heading, [...entries]);
    }
  }

  return merged;
}

/**
 * Render merged sections back to markdown, respecting section order.
 */
function renderSections(sections) {
  const lines = [];

  // Ordered sections first
  for (const heading of SECTION_ORDER) {
    if (sections.has(heading)) {
      lines.push(`### ${heading}\n`);
      for (const entry of sections.get(heading)) {
        lines.push(entry);
      }
      lines.push('');
      sections.delete(heading);
    }
  }

  // Any remaining sections not in the standard order
  for (const [heading, entries] of sections) {
    lines.push(`### ${heading}\n`);
    for (const entry of entries) {
      lines.push(entry);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.error(`Changelog not found: ${CHANGELOG_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CHANGELOG_PATH, 'utf-8');

  // Find [Unreleased] section boundaries
  const unreleasedMatch = content.match(/^## \[Unreleased\]\s*$/m);
  if (!unreleasedMatch) {
    console.log('No [Unreleased] section found. Nothing to merge.');
    process.exit(0);
  }

  const unreleasedStart = unreleasedMatch.index + unreleasedMatch[0].length;

  // Find the next versioned section (## [X.Y.Z])
  const versionedPattern = /^## \[\d+\.\d+\.\d+\]/m;
  const afterUnreleased = content.slice(unreleasedStart);
  const versionedMatch = afterUnreleased.match(versionedPattern);

  if (!versionedMatch) {
    console.log('No versioned section found after [Unreleased]. Nothing to merge into.');
    process.exit(0);
  }

  const unreleasedText = afterUnreleased.slice(0, versionedMatch.index).trim();
  if (!unreleasedText) {
    console.log('[Unreleased] is empty. Nothing to merge.');
    process.exit(0);
  }

  // Parse manual entries from [Unreleased]
  const manualSections = parseSections(unreleasedText);
  if (manualSections.size === 0) {
    console.log('[Unreleased] has no section headings. Nothing to merge.');
    process.exit(0);
  }

  // Find the versioned section's content (between its heading and the next ## heading)
  const versionedAbsoluteStart = unreleasedStart + versionedMatch.index;
  const versionedHeadingEnd = content.indexOf('\n', versionedAbsoluteStart) + 1;
  const versionedHeading = content.slice(versionedAbsoluteStart, versionedHeadingEnd);

  const restAfterVersioned = content.slice(versionedHeadingEnd);
  const nextSectionMatch = restAfterVersioned.match(/^## \[/m);
  const versionedEnd = nextSectionMatch
    ? versionedHeadingEnd + nextSectionMatch.index
    : content.length;

  const versionedText = content.slice(versionedHeadingEnd, versionedEnd).trim();
  const versionedSections = parseSections(versionedText);

  // Merge
  const merged = mergeSections(manualSections, versionedSections);
  const mergedText = renderSections(merged);

  // Reconstruct changelog
  const before = content.slice(0, unreleasedMatch.index);
  const after = content.slice(versionedEnd);

  const newContent = [
    before.trimEnd(),
    '',
    '## [Unreleased]',
    '',
    versionedHeading.trimEnd(),
    '',
    mergedText.trimEnd(),
    '',
    after.trimStart(),
  ].join('\n');

  fs.writeFileSync(CHANGELOG_PATH, newContent, 'utf-8');

  const entryCount = [...manualSections.values()].reduce((sum, entries) => sum + entries.length, 0);
  console.log(`Merged ${entryCount} manual entries from ${manualSections.size} sections into ${versionedHeading.trim()}`);
}

main();
