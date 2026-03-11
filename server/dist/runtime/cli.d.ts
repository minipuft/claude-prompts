export interface ServerCliArgs {
    help: boolean;
    init?: string;
    transport?: string;
    logLevel?: string;
    verbose: boolean;
    quiet: boolean;
    debugStartup: boolean;
    startupTest: boolean;
    suppressDebug: boolean;
    testMode: boolean;
    workspace?: string;
    config?: string;
    prompts?: string;
    methodologies?: string;
    gates?: string;
    scripts?: string;
    styles?: string;
    workspaceId?: string;
    organizationId?: string;
    identityMode?: string;
    client?: string;
}
export declare function parseServerCliArgs(args?: string[]): ServerCliArgs;
