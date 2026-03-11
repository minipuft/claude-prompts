import type { GateService } from './gate-service-interface.js';
import type { Logger } from '../../../infra/logging/index.js';
import type { ConfigManager } from '../../../shared/types/index.js';
import type { GateValidator } from '../core/gate-validator.js';
import type { GateGuidanceRenderer } from '../guidance/GateGuidanceRenderer.js';
export declare class GateServiceFactory {
    private readonly logger;
    private readonly configManager;
    private readonly gateGuidanceRenderer;
    private readonly gateValidator;
    constructor(logger: Logger, configManager: ConfigManager, gateGuidanceRenderer: GateGuidanceRenderer, gateValidator: GateValidator);
    createGateService(): GateService;
    hotReload(): Promise<GateService>;
}
