export type RegistrationScope = 'user' | 'project';
export interface RegistrationMutation {
    clientId: string;
    scope: RegistrationScope;
    resourceKeys: string[];
}
export interface RegistrationMutationResult {
    updated: boolean;
    addedKeys: number;
}
export declare function applyRegistrationMutations(configPath: string, mutations: RegistrationMutation[]): Promise<RegistrationMutationResult>;
export declare function previewRegistrationMutations(configPath: string, mutations: RegistrationMutation[]): Promise<RegistrationMutationResult>;
