export interface OutputOptions {
  json?: boolean;
  raw?: boolean;
}

// ─── Inline ANSI Color (zero dependencies, NO_COLOR + TTY aware) ─────────────

const ANSI = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
} as const;

function shouldColor(): boolean {
  return Boolean(process.stderr.isTTY && !process.env['NO_COLOR']);
}

export function color(text: string, c: keyof typeof ANSI): string {
  if (c === 'reset') return text;
  return shouldColor() ? `${ANSI[c]}${text}${ANSI.reset}` : text;
}

export const icons = {
  success: () => color('\u2713', 'green'),
  error: () => color('\u2717', 'red'),
  warn: () => color('\u26A0', 'yellow'),
} as const;

/** Detect CI environments for auto-formatting decisions. */
export function isCI(): boolean {
  return Boolean(
    process.env['CI'] ||
      process.env['GITHUB_ACTIONS'] ||
      process.env['JENKINS_URL'] ||
      process.env['GITLAB_CI'],
  );
}

/** Route data to the appropriate output format. */
export function output(data: unknown, options: OutputOptions = {}): void {
  if (options.raw) {
    console.log(typeof data === 'string' ? data : JSON.stringify(data));
    return;
  }

  if (options.json) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (Array.isArray(data)) {
    printTable(data as Record<string, unknown>[]);
    return;
  }

  if (typeof data === 'object' && data !== null) {
    printKeyValue(data as Record<string, unknown>);
    return;
  }

  console.log(String(data));
}

function printTable(rows: Record<string, unknown>[]): void {
  const first = rows[0];
  if (!first) {
    console.log('(empty)');
    return;
  }

  const headers = Object.keys(first);
  const widths = headers.map((h) =>
    Math.max(h.length, ...rows.map((r) => String(r[h] ?? '').length)),
  );

  const separator = widths.map((w) => '-'.repeat(w + 2)).join('+');
  const formatRow = (cells: string[]) =>
    cells.map((c, i) => ` ${c.padEnd(widths[i] ?? 0)} `).join('|');

  console.log(formatRow(headers));
  console.log(separator);
  for (const row of rows) {
    console.log(formatRow(headers.map((h) => String(row[h] ?? ''))));
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return value.map(String).join(', ');
  return JSON.stringify(value);
}

function printKeyValue(obj: Record<string, unknown>): void {
  const entries = Object.entries(obj);
  if (entries.length === 0) return;

  const maxKeyLen = Math.max(...entries.map(([k]) => k.length));
  for (const [key, value] of entries) {
    console.log(`${key.padEnd(maxKeyLen)}  ${formatValue(value)}`);
  }
}
