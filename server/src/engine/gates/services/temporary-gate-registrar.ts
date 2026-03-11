// @lifecycle canonical - Registers temporary gates from normalized specifications.
import { formatCriteriaAsGuidance } from '../../execution/pipeline/criteria-guidance.js';

import type { GateReferenceResolver } from './gate-reference-resolver.js';
import type { Logger } from '../../../infra/logging/index.js';
import type { ExecutionContext } from '../../execution/context/index.js';
import type { TemporaryGateInput } from '../../execution/types.js';
import type {
  TemporaryGateDefinition,
  TemporaryGateRegistry,
} from '../core/temporary-gate-registry.js';

/**
 * Result of temporary gate registration.
 */
export interface RegisteredGateResult {
  readonly temporaryGateIds: string[];
  readonly canonicalGateIds: string[];
}

/**
 * Normalized gate input structure for creating temporary gates.
 */
export interface NormalizedGateInput {
  name: string;
  type: 'validation' | 'guidance';
  scope: 'execution' | 'session' | 'chain' | 'step';
  criteria?: string[];
  guidance?: string;
  description?: string;
  pass_criteria?: string[];
  source: 'manual' | 'automatic' | 'analysis';
  context?: Record<string, unknown>;
  target_step_number?: number;
  apply_to_steps?: number[];
}

/**
 * Raw gate input (flexible structure for parsing).
 * Accepts any object with at least some gate-like properties.
 */
export type RawGateInput =
  | string
  | TemporaryGateInput
  | {
      id?: string;
      name?: string;
      type?: string;
      scope?: string;
      criteria?: string[] | readonly string[];
      guidance?: string;
      description?: string;
      pass_criteria?: string[] | readonly string[];
      source?: string;
      context?: unknown;
    };

/**
 * Registers temporary gates from raw specifications and resolves canonical references.
 *
 * Handles:
 * - Normalizing heterogeneous gate inputs (strings, objects, TemporaryGateInput)
 * - Resolving canonical gate IDs from references
 * - Deduplication within a single batch
 * - Creating temporary gate definitions in the registry
 */
export class TemporaryGateRegistrar {
  constructor(
    private readonly temporaryGateRegistry: TemporaryGateRegistry | undefined,
    private readonly gateReferenceResolver: GateReferenceResolver | undefined,
    private readonly logger: Logger
  ) {}

  /**
   * Register temporary gates from the unified `gates` parameter on the execution context.
   * Returns IDs of created temporary gates and resolved canonical gates.
   */
  async registerTemporaryGates(context: ExecutionContext): Promise<RegisteredGateResult> {
    this.logger.debug('[TemporaryGateRegistrar] registerTemporaryGates - parsedCommand structure', {
      hasOperators: Boolean(context.parsedCommand?.operators),
      format: context.parsedCommand?.format,
    });

    const overrides = context.state.gates.requestedOverrides as Record<string, any> | undefined;
    const normalizedGates = overrides?.['gates'] as
      | import('../../../shared/types/execution.js').GateSpecification[]
      | undefined;

    const canonicalGateIds = new Set<string>();
    const resolvedGateIds = new Set<string>();
    const createdIds: string[] = [];

    const tempGateInputs: RawGateInput[] = normalizedGates ?? [];

    const registry = this.temporaryGateRegistry;
    const registryAvailable = registry !== undefined;
    if (!tempGateInputs.length) {
      return { temporaryGateIds: [], canonicalGateIds: [] };
    }

    const scopeId =
      context.getSessionId?.() ||
      context.mcpRequest.chain_id ||
      context.mcpRequest.command ||
      'execution';

    const isChainExecution =
      context.hasChainCommand() ||
      (context.parsedCommand?.steps !== undefined && context.parsedCommand.steps.length > 1);
    const currentStep = context.sessionContext?.currentStep ?? 1;

    const seenStringInputs = new Set<string>();
    const seenGateSignatures = new Set<string>();

    for (const rawGate of tempGateInputs) {
      try {
        if (typeof rawGate === 'string') {
          const trimmed = rawGate.trim();
          if (!trimmed || seenStringInputs.has(trimmed)) {
            continue;
          }
          seenStringInputs.add(trimmed);

          if (this.gateReferenceResolver) {
            const resolution = await this.gateReferenceResolver.resolve(trimmed);
            if (resolution.referenceType === 'registered') {
              canonicalGateIds.add(resolution.gateId);
              resolvedGateIds.add(resolution.gateId);
              this.logger.debug(
                '[TemporaryGateRegistrar] Resolved string gate to canonical definition',
                { input: trimmed, gateId: resolution.gateId }
              );
              continue;
            }
          }

          this.logger.debug(
            '[TemporaryGateRegistrar] String gate not canonical, treating as criteria',
            { input: trimmed }
          );
        }

        if (typeof rawGate === 'object' && rawGate !== null) {
          const canonicalCandidate = await this.resolveCanonicalGateId(rawGate, resolvedGateIds);
          if (canonicalCandidate) {
            canonicalGateIds.add(canonicalCandidate);
            resolvedGateIds.add(canonicalCandidate);
            this.logger.debug(
              '[TemporaryGateRegistrar] Resolved object gate to canonical definition',
              { gateId: canonicalCandidate }
            );
            continue;
          }
        }

        const { normalized: gate, isValid } = this.normalizeGateInput(
          rawGate,
          isChainExecution,
          currentStep
        );

        if (!isValid) {
          this.logger.warn('[TemporaryGateRegistrar] Invalid gate format, skipping', {
            gate: rawGate,
          });
          continue;
        }

        const criteria = gate.criteria ?? gate.pass_criteria ?? [];
        const criteriaArray = Array.isArray(criteria)
          ? criteria.filter((c): c is string => typeof c === 'string')
          : [];

        const signatureParts = [
          gate.type ?? 'validation',
          gate.scope ?? 'execution',
          (gate.name ?? '').toLowerCase(),
          (gate.description ?? '').toLowerCase(),
          (gate.guidance ?? '').toLowerCase(),
          criteriaArray.join('|').toLowerCase(),
          (gate.apply_to_steps ?? []).join(','),
          gate.target_step_number ?? '',
        ];
        const gateSignature = signatureParts.join('||');
        if (seenGateSignatures.has(gateSignature)) {
          this.logger.debug('[TemporaryGateRegistrar] Skipping duplicate temporary gate', {
            signature: gateSignature,
          });
          continue;
        }
        seenGateSignatures.add(gateSignature);

        const effectiveGuidance = this.resolveGateGuidance(gate, criteriaArray);

        if (effectiveGuidance && !gate.guidance) {
          this.logger.debug('[TemporaryGateRegistrar] Resolved guidance from fallback', {
            source: criteriaArray.length > 0 ? 'criteria' : 'description',
            guidanceLength: effectiveGuidance.length,
          });
        }

        if (!effectiveGuidance) {
          this.logger.warn('[TemporaryGateRegistrar] Skipping gate with no usable content', {
            gate,
          });
          continue;
        }

        if (!registryAvailable) {
          continue;
        }

        const gateIdCandidate =
          typeof rawGate === 'object' &&
          rawGate !== null &&
          'id' in rawGate &&
          typeof rawGate.id === 'string'
            ? rawGate.id
            : null;

        if (gateIdCandidate && registry.getTemporaryGate(gateIdCandidate)) {
          this.logger.debug('[TemporaryGateRegistrar] Skipping gate already registered', {
            gateId: gateIdCandidate,
          });
          createdIds.push(gateIdCandidate);
          continue;
        }

        const tempGateDefinition: Omit<TemporaryGateDefinition, 'id' | 'created_at'> & {
          id?: string;
        } = {
          name: gate.name,
          type: gate.type,
          scope: gate.scope,
          description: gate.description ?? effectiveGuidance.substring(0, 100),
          guidance: effectiveGuidance,
          source: gate.source,
        };

        if (gateIdCandidate) {
          tempGateDefinition.id = gateIdCandidate;
        }
        if (criteriaArray.length > 0) {
          tempGateDefinition.pass_criteria = criteriaArray;
        } else if (gate.pass_criteria !== undefined) {
          tempGateDefinition.pass_criteria = gate.pass_criteria;
        }
        if (gate.context !== undefined) {
          tempGateDefinition.context = gate.context;
        }
        if (gate.target_step_number !== undefined) {
          tempGateDefinition.target_step_number = gate.target_step_number;
        }
        if (gate.apply_to_steps !== undefined) {
          tempGateDefinition.apply_to_steps = gate.apply_to_steps;
        }

        const gateId = registry.createTemporaryGate(tempGateDefinition, scopeId);

        createdIds.push(gateId);
        this.trackTemporaryGateScope(context, gate.scope ?? 'execution', scopeId);

        this.logger.debug('[TemporaryGateRegistrar] Registered temporary gate', {
          gateId,
          name: gate.name,
          hasGuidance: !!effectiveGuidance,
          guidanceLength: effectiveGuidance.length,
          criteriaCount: criteriaArray.length,
        });
      } catch (error) {
        this.logger.warn('[TemporaryGateRegistrar] Failed to register temporary gate', {
          gate: rawGate,
          error,
        });
      }
    }

    if (registryAvailable && createdIds.length) {
      const existing = context.state.gates.temporaryGateIds ?? [];
      context.state.gates.temporaryGateIds = [...existing, ...createdIds];

      this.logger.info('[TemporaryGateRegistrar] Successfully registered temporary gates', {
        count: createdIds.length,
        gateIds: createdIds,
      });
    }

    if (canonicalGateIds.size > 0) {
      const overrides = context.state.gates.requestedOverrides as
        | Record<string, unknown>
        | undefined;

      const existingGates = (overrides?.['gates'] as any[]) ?? [];
      const existingGateStrings = existingGates.filter((g): g is string => typeof g === 'string');
      const merged = new Set<string>(existingGateStrings);
      canonicalGateIds.forEach((gateId) => merged.add(gateId));

      if (overrides) {
        const nonStringGates = existingGates.filter((g) => typeof g !== 'string');
        overrides['gates'] = [...Array.from(merged), ...nonStringGates];
      }
      context.state.gates.canonicalGateIdsFromTemporary = Array.from(canonicalGateIds);
    }

    return {
      temporaryGateIds: registryAvailable ? createdIds : [],
      canonicalGateIds: Array.from(canonicalGateIds),
    };
  }

  /**
   * Normalize raw gate input to standard format.
   */
  normalizeGateInput(
    gate: RawGateInput,
    isChainExecution: boolean = false,
    currentStep: number = 1
  ): { normalized: NormalizedGateInput; isValid: boolean } {
    if (typeof gate === 'string') {
      return {
        normalized: {
          name: 'Inline Validation Criteria',
          type: 'validation',
          scope: 'execution',
          description: 'Inline validation criteria',
          source: 'automatic',
          ...(gate ? { criteria: [gate] } : {}),
          ...(isChainExecution ? { apply_to_steps: [currentStep] } : {}),
        },
        isValid: true,
      };
    }

    const normalizeType = (type: string | undefined): NormalizedGateInput['type'] => {
      const validTypes: NormalizedGateInput['type'][] = ['validation', 'guidance'];
      return validTypes.includes(type as NormalizedGateInput['type'])
        ? (type as NormalizedGateInput['type'])
        : 'validation';
    };

    const normalizeScope = (scope: string | undefined): NormalizedGateInput['scope'] => {
      const validScopes: NormalizedGateInput['scope'][] = ['execution', 'session', 'chain', 'step'];
      return validScopes.includes(scope as NormalizedGateInput['scope'])
        ? (scope as NormalizedGateInput['scope'])
        : 'execution';
    };

    const normalizeSource = (source: string | undefined): NormalizedGateInput['source'] => {
      const validSources: NormalizedGateInput['source'][] = ['manual', 'automatic', 'analysis'];
      return validSources.includes(source as NormalizedGateInput['source'])
        ? (source as NormalizedGateInput['source'])
        : 'automatic';
    };

    const normalizeCriteria = (
      criteria: unknown[] | readonly unknown[] | undefined
    ): string[] | undefined => {
      if (criteria === undefined || !Array.isArray(criteria)) return undefined;
      const stringCriteria = criteria.filter((c): c is string => typeof c === 'string');
      return stringCriteria.length > 0 ? stringCriteria : undefined;
    };

    const normalizeContext = (context: unknown): Record<string, unknown> | undefined => {
      if (context === undefined || context === null) return undefined;
      if (typeof context === 'object') {
        return context as Record<string, unknown>;
      }
      return undefined;
    };

    const extractedCriteria = 'criteria' in gate ? gate.criteria : undefined;
    const extractedPassCriteria = 'pass_criteria' in gate ? gate.pass_criteria : undefined;

    const targetStepNumber =
      'target_step_number' in gate && typeof gate.target_step_number === 'number'
        ? gate.target_step_number
        : undefined;
    const applyToSteps =
      'apply_to_steps' in gate && Array.isArray(gate.apply_to_steps)
        ? gate.apply_to_steps.filter((n): n is number => typeof n === 'number')
        : undefined;

    const effectiveApplyToSteps =
      applyToSteps && applyToSteps.length > 0
        ? applyToSteps
        : targetStepNumber === undefined && isChainExecution
          ? [currentStep]
          : undefined;

    const normalized: NormalizedGateInput = {
      name: gate.name ?? gate.id ?? 'Inline Quality Criteria',
      type: normalizeType(gate.type),
      scope: normalizeScope(gate.scope),
      description: gate.description ?? 'Temporary gate criteria',
      source: normalizeSource(gate.source),
    };

    const criteria = normalizeCriteria(extractedCriteria);
    if (criteria !== undefined) {
      normalized.criteria = criteria;
    }

    if (gate.guidance !== undefined) {
      normalized.guidance = gate.guidance;
    }

    const passCriteria = normalizeCriteria(extractedPassCriteria ?? extractedCriteria);
    if (passCriteria !== undefined) {
      normalized.pass_criteria = passCriteria;
    }

    const contextValue = normalizeContext(gate.context);
    if (contextValue !== undefined) {
      normalized.context = contextValue;
    }

    if (targetStepNumber !== undefined) {
      normalized.target_step_number = targetStepNumber;
    }

    if (effectiveApplyToSteps !== undefined) {
      normalized.apply_to_steps = effectiveApplyToSteps;
    }

    return { normalized, isValid: true };
  }

  /**
   * Resolve effective guidance using fallback chain.
   * Priority: explicit guidance > criteria-derived > description.
   */
  resolveGateGuidance(gate: NormalizedGateInput, criteria: string[]): string {
    if (gate.guidance) {
      return gate.guidance;
    }
    if (criteria.length > 0) {
      return formatCriteriaAsGuidance(criteria);
    }
    if (gate.description) {
      return gate.description;
    }
    return '';
  }

  private trackTemporaryGateScope(
    context: ExecutionContext,
    scope: string,
    scopeId?: string
  ): void {
    if (!scopeId) {
      return;
    }

    const normalizedScope: 'execution' | 'session' | 'chain' | 'step' =
      scope === 'session' || scope === 'chain' || scope === 'step' ? scope : 'execution';

    const scopes = context.state.gates.temporaryGateScopes ?? [];

    if (!context.state.gates.temporaryGateScopes) {
      context.state.gates.temporaryGateScopes = scopes;
    }

    const exists = scopes.some(
      (entry) => entry.scope === normalizedScope && entry.scopeId === scopeId
    );
    if (!exists) {
      scopes.push({ scope: normalizedScope, scopeId });
    }
  }

  private async resolveCanonicalGateId(
    gate: RawGateInput,
    requestedQualityGates: Set<string>
  ): Promise<string | undefined> {
    const candidate = this.extractGateReferenceCandidate(gate);
    if (!candidate || requestedQualityGates.has(candidate)) {
      return undefined;
    }

    if (typeof gate === 'object' && gate !== null && this.gateInputContainsInlineContent(gate)) {
      return undefined;
    }

    if (!this.gateReferenceResolver) {
      return undefined;
    }

    const resolution = await this.gateReferenceResolver.resolve(candidate);
    if (
      resolution.referenceType === 'registered' &&
      !requestedQualityGates.has(resolution.gateId)
    ) {
      return resolution.gateId;
    }
    return undefined;
  }

  private extractGateReferenceCandidate(gate: RawGateInput): string | undefined {
    if (typeof gate === 'string') {
      const trimmed = gate.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }

    if (gate && typeof gate === 'object') {
      const id = 'id' in gate && typeof gate.id === 'string' ? gate.id : undefined;
      const trimmed = id?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : undefined;
    }

    return undefined;
  }

  private gateInputContainsInlineContent(gate: Record<string, unknown>): boolean {
    const hasCriteria = Array.isArray(gate['criteria']) && gate['criteria'].length > 0;
    const hasPassCriteria =
      Array.isArray(gate['pass_criteria']) && gate['pass_criteria'].length > 0;
    const hasGuidance = typeof gate['guidance'] === 'string' && gate['guidance'].trim().length > 0;
    const hasDescription =
      typeof gate['description'] === 'string' && gate['description'].trim().length > 0;
    return hasCriteria || hasPassCriteria || hasGuidance || hasDescription;
  }
}
