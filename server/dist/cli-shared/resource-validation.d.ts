import { type ResourceVerificationIssue, type ResourceVerificationResult, type ResourceVerificationType } from '../modules/resources/services/resource-verification-service.js';
export type ResourceValidationType = Exclude<ResourceVerificationType, 'tools'>;
export type ResourceValidationIssue = ResourceVerificationIssue;
export type ResourceValidationResult = ResourceVerificationResult;
export declare function validateResourceDocument(resourceType: ResourceValidationType, resourceId: string, filePath: string, data: unknown): ResourceValidationResult;
export declare function validateResourceFile(resourceType: ResourceValidationType, resourceId: string, filePath: string): ResourceValidationResult;
export declare function formatValidationIssues(issues: ResourceValidationIssue[]): string[];
