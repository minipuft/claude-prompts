// @lifecycle canonical - Shared identity scope resolver for continuity semantics.
const DEFAULT_IDENTITY_SCOPE_ID = 'default';

export interface IdentityScopeInput {
  workspaceId?: unknown;
  organizationId?: unknown;
}

function normalizeScopeValue(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

/**
 * Resolve the canonical continuity scope key for state/session isolation.
 *
 * Precedence:
 * 1) workspaceId (shared continuity across clients in same workspace)
 * 2) organizationId (canonical organization fallback)
 * 3) "default" (legacy compatibility only)
 */
export function resolveContinuityScopeId(
  input?: IdentityScopeInput,
  fallback: string = DEFAULT_IDENTITY_SCOPE_ID
): string {
  return (
    normalizeScopeValue(input?.workspaceId) ??
    normalizeScopeValue(input?.organizationId) ??
    fallback
  );
}

export { DEFAULT_IDENTITY_SCOPE_ID };
