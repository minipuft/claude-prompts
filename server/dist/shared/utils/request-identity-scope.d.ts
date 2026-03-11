declare const DEFAULT_IDENTITY_SCOPE_ID = "default";
export interface IdentityScopeInput {
    workspaceId?: unknown;
    organizationId?: unknown;
}
/**
 * Resolve the canonical continuity scope key for state/session isolation.
 *
 * Precedence:
 * 1) workspaceId (shared continuity across clients in same workspace)
 * 2) organizationId (canonical organization fallback)
 * 3) "default" (legacy compatibility only)
 */
export declare function resolveContinuityScopeId(input?: IdentityScopeInput, fallback?: string): string;
export { DEFAULT_IDENTITY_SCOPE_ID };
