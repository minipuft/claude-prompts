export type ResourceVerificationType = 'prompts' | 'gates' | 'methodologies' | 'styles' | 'tools';
export interface ResourceVerificationIssue {
    code: string;
    path: string;
    message: string;
}
export interface ResourceVerificationResult {
    valid: boolean;
    resourceType: ResourceVerificationType;
    resourceId: string;
    filePath: string;
    errors: ResourceVerificationIssue[];
    warnings: ResourceVerificationIssue[];
}
export interface ResourceVerificationFailurePayload {
    resourceType: ResourceVerificationType;
    resourceId: string;
    filePath: string;
    errors: ResourceVerificationIssue[];
    warnings: ResourceVerificationIssue[];
    rolledBack: boolean;
}
export declare class ResourceVerificationError extends Error {
    readonly payload: ResourceVerificationFailurePayload;
    constructor(payload: ResourceVerificationFailurePayload, message?: string);
}
export declare class ResourceVerificationService {
    validateDocument(resourceType: ResourceVerificationType, resourceId: string, filePath: string, data: unknown): ResourceVerificationResult;
    validateFile(resourceType: ResourceVerificationType, resourceId: string, filePath: string): ResourceVerificationResult;
    formatIssues(issues: ResourceVerificationIssue[]): string[];
    toFailurePayload(result: ResourceVerificationResult, rolledBack: boolean): ResourceVerificationFailurePayload;
    formatFailurePayload(payload: ResourceVerificationFailurePayload): string;
    private validateResourceData;
}
