export declare const SKILLS_SYNC_MANAGED_BY = "claude-prompts-skills-sync";
export type SkillsSyncScope = 'user' | 'project';
export interface SyncManifestLikeEntry {
    outputFiles: string[];
}
export interface ManagedSkillMarker {
    managedBy: string;
    clientId: string;
    scope: SkillsSyncScope;
    resourceKey: string;
}
export type ManagedSkillDirMap = Map<string, Set<string>>;
export interface SyncPrunePlan {
    managedResourceKeys: string[];
    pruneResourceKeys: string[];
    pruneSkillDirs: string[];
}
interface SyncPrunePlanInput {
    desiredResourceKeys: Set<string>;
    manifestManagedSkillDirs: ManagedSkillDirMap;
    markerManagedSkillDirs: ManagedSkillDirMap;
}
interface ManagedMarkerInput {
    clientId: string;
    scope: SkillsSyncScope;
    resourceKey: string;
}
export declare function mergeManagedSkillDirMaps(left: ManagedSkillDirMap, right: ManagedSkillDirMap): ManagedSkillDirMap;
export declare function collectManifestManagedSkillDirs(manifestEntries: Map<string, SyncManifestLikeEntry>): ManagedSkillDirMap;
export declare function parseManagedSkillMarker(skillMarkdown: string): ManagedSkillMarker | null;
export declare function buildSyncPrunePlan(input: SyncPrunePlanInput): SyncPrunePlan;
export declare function injectManagedSkillMarker(skillMarkdown: string, marker: ManagedMarkerInput): string;
export {};
