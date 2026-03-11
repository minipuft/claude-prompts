import { ResourceMutationTransaction, ResourceVerificationService, type ResourceVerificationFailurePayload } from '../../../../modules/resources/services/index.js';
import type { ConfigManager, Logger } from '../../../../shared/types/index.js';
import type { GateCreationData } from '../core/types.js';
export interface GateFileWriterDependencies {
    logger: Logger;
    configManager: ConfigManager;
    resourceVerificationService?: ResourceVerificationService;
    resourceMutationTransaction?: ResourceMutationTransaction;
}
export interface GateFileWriteResult {
    success: boolean;
    paths?: string[];
    error?: string;
    verificationFailure?: ResourceVerificationFailurePayload;
}
export declare class GateFileWriter {
    private readonly logger;
    private readonly configManager;
    private readonly verificationService;
    private readonly mutationTransaction;
    constructor(dependencies: GateFileWriterDependencies);
    writeGateFiles(data: GateCreationData): Promise<GateFileWriteResult>;
    private buildGateYaml;
}
