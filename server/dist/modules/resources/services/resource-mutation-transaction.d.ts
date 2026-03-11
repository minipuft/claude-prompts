import { type ResourceVerificationFailurePayload, type ResourceVerificationResult } from './resource-verification-service.js';
export interface ResourceMutationTarget {
    path: string;
    kind?: 'file' | 'directory';
}
export interface ResourceMutationTransactionOptions<T> {
    targets: ResourceMutationTarget[];
    mutate: () => Promise<T> | T;
    validate?: () => Promise<ResourceVerificationResult> | ResourceVerificationResult;
}
export interface ResourceMutationTransactionResult<T> {
    success: boolean;
    result?: T;
    validation?: ResourceVerificationResult;
    verificationFailure?: ResourceVerificationFailurePayload;
    rolledBack: boolean;
    error?: string;
}
export declare class ResourceMutationTransaction {
    run<T>(options: ResourceMutationTransactionOptions<T>): Promise<ResourceMutationTransactionResult<T>>;
    private captureSnapshots;
    private restoreSnapshots;
    private detectTargetKind;
}
