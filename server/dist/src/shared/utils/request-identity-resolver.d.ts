import type { IdentityLaunchDefaults, IdentityPolicyMode, RequestClientProfile, RequestClientProfileSource, RequestIdentity, RequestIdentityContext, RequestIdentitySource, RequestIdentityTransport, TransportMode } from '../../shared/types/index.js';
type StrictIdentityClaim = 'organizationId' | 'workspaceId';
export interface StrictIdentityValidationResult {
    valid: boolean;
    missingClaims: StrictIdentityClaim[];
    message?: string;
}
export interface LockedIdentityValidationResult {
    valid: boolean;
    reason?: 'missing-launch-default' | 'override-attempted' | 'default-fallback';
    message?: string;
}
/**
 * Minimal shape of MCP SDK RequestHandlerExtra relevant to identity resolution.
 * Avoids tight coupling to the full SDK type.
 */
export interface McpRequestExtra {
    authInfo?: {
        extra?: Record<string, unknown>;
        sub?: string;
        [key: string]: unknown;
    };
    clientInfo?: {
        name?: string;
        version?: string;
        [key: string]: unknown;
    };
    sessionId?: string;
    headers?: Record<string, unknown>;
    requestInfo?: {
        headers?: Record<string, unknown>;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
export interface RequestIdentityResolverOptions {
    mode: IdentityPolicyMode;
    allowPerRequestOverride: boolean;
    launchDefaults?: IdentityLaunchDefaults;
    transportMode?: TransportMode;
    requestClientProfileHint?: RequestClientProfileHint;
}
interface IdentityContextOptions {
    mode?: IdentityPolicyMode;
    allowPerRequestOverride?: boolean;
    launchDefaults?: IdentityLaunchDefaults;
    organizationSource?: RequestIdentitySource;
    workspaceSource?: RequestIdentitySource;
    transport?: RequestIdentityTransport;
    precedence?: string[];
    overrideAttempted?: boolean;
    usedDefaultFallback?: boolean;
    clientProfile?: RequestClientProfile;
    clientProfileSource?: RequestClientProfileSource;
    clientPrecedence?: string[];
}
export interface RequestClientProfileHint {
    clientFamily?: string;
    clientId?: string;
    clientVersion?: string;
    delegationProfile?: string;
}
/**
 * Resolve canonical request identity from MCP request handler metadata.
 *
 * Priority for canonical derivation:
 * 1. organizationId from token/header organization claims
 * 2. workspaceId from token/header workspace/project claims
 * 3. fallback workspaceId to organizationId
 * 4. "default"
 */
export declare function resolveRequestIdentity(extra?: McpRequestExtra | null): RequestIdentity;
export declare function resolveRequestIdentityContext(extra: McpRequestExtra | undefined, options: RequestIdentityResolverOptions): RequestIdentityContext;
/**
 * Build the normalized context shape passed into tool handlers/services.
 *
 * continuityScopeId precedence is canonical:
 * workspaceId -> organizationId -> default.
 */
export declare function toIdentityContext(identity: RequestIdentity, options?: IdentityContextOptions): RequestIdentityContext;
/**
 * Strict identity validation for multi-workspace deployments.
 * Requires concrete organization/workspace scope claims (no default fallback scope).
 */
export declare function validateStrictIdentityClaims(identity: RequestIdentity | RequestIdentityContext): StrictIdentityValidationResult;
export declare function validateLockedIdentityContext(identityContext: RequestIdentityContext): LockedIdentityValidationResult;
export {};
