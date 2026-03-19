/**
 * Gate System Manager - Runtime State Management
 *
 * Provides runtime enable/disable functionality for the gates system,
 * following the same pattern as FrameworkStateStore for consistency.
 */
import { EventEmitter } from 'events';
import { SqliteStateStore } from '../../infra/database/stores/sqlite-store.js';
import { Logger } from '../../infra/logging/index.js';
import type { StateStoreOptions } from '../../infra/database/stores/interface.js';
/**
 * Gate system state interface
 */
export interface GateSystemState {
    enabled: boolean;
    enabledAt: Date;
    enableReason: string;
    isHealthy: boolean;
    validationMetrics: {
        totalValidations: number;
        successfulValidations: number;
        averageValidationTime: number;
        lastValidationTime: Date | null;
    };
}
/**
 * Gate system health status
 */
export interface GateSystemHealth {
    status: 'healthy' | 'degraded' | 'disabled';
    enabled: boolean;
    totalValidations: number;
    successRate: number;
    averageValidationTime: number;
    lastValidationTime: Date | null;
    issues: string[];
}
/**
 * Persisted gate state (saved to SQLite)
 */
export interface PersistedGateSystemState {
    enabled: boolean;
    enabledAt: string;
    enableReason: string;
    validationMetrics: {
        totalValidations: number;
        successfulValidations: number;
        averageValidationTime: number;
        lastValidationTime: string | null;
    };
}
/**
 * Gate system enable/disable request
 */
export interface GateSystemToggleRequest {
    enabled: boolean;
    reason?: string;
}
/**
 * Gate system events
 */
export interface GateSystemEvents {
    'system-enabled': [reason: string];
    'system-disabled': [reason: string];
    'health-changed': [health: GateSystemHealth];
    'validation-completed': [success: boolean, executionTime: number];
}
/**
 * Gate System Manager - Runtime state management
 */
export declare class GateStateStore extends EventEmitter {
    private scopedStates;
    private logger;
    private readonly serverRoot;
    private stateStore?;
    private healthCheckInterval?;
    constructor(logger: Logger, stateStoreOrDir?: SqliteStateStore<PersistedGateSystemState> | string);
    private static createDefaultState;
    private resolveStateKey;
    private getOrCreateScopedState;
    /**
     * Initialize the gate system manager
     */
    initialize(): Promise<void>;
    /**
     * Load state from SQLite
     */
    private loadStateFromFile;
    /**
     * Save current state to SQLite
     */
    private saveStateToFile;
    /**
     * Validate persisted state structure
     */
    private isValidPersistedState;
    /**
     * Check if gate system is enabled
     */
    isGateSystemEnabled(scope?: StateStoreOptions): boolean;
    /**
     * Enable the gate system
     */
    enableGateSystem(reason?: string, scope?: StateStoreOptions): Promise<void>;
    /**
     * Disable the gate system
     */
    disableGateSystem(reason?: string, scope?: StateStoreOptions): Promise<void>;
    /**
     * Get current system health
     */
    getSystemHealth(scope?: StateStoreOptions): GateSystemHealth;
    /**
     * Record a validation execution for metrics
     */
    recordValidation(success: boolean, executionTime: number, scope?: StateStoreOptions): void;
    /**
     * Get current state for inspection
     */
    getCurrentState(scope?: StateStoreOptions): GateSystemState;
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
/**
 * Create a gate system manager instance
 */
export declare function createGateStateStore(logger: Logger, stateStoreOrDir?: SqliteStateStore<PersistedGateSystemState> | string): GateStateStore;
