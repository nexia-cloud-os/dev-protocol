export declare const PROTOCOL_VERSION: '1';
export declare const DISCOVERY_PATH: '/.well-known/nexia-developer-platform';
export interface DeveloperManifest {
  schema_version: '1';
  app: { id: string; name: string; version: string };
  screens: Array<{ id: string; route: string; entry: string }>;
  permissions?: { required: string[] };
}
export interface ValidationError { path: string; message: string }
export interface ValidationResult { valid: boolean; errors: ValidationError[] }
export declare function validateManifest(value: unknown): ValidationResult;
export interface DeveloperDiscovery {
  protocol_version: '1';
  status: 'experimental';
  capabilities: {
    manifest_validation: boolean;
    project_management: boolean;
    remote_development: boolean;
    deployments: boolean;
    functions: boolean;
  };
  authentication: { methods: string[] };
}
