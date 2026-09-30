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
    repository_submissions?: boolean;
  };
  authentication: { methods: string[] };
}

/** Source and version are resolved by Core, never supplied by the caller. */
export interface TagSubmissionRequest { app_id: string; tag: string; request_id: string }
export interface GithubRepositoryConnection {
  repository_id: number;
  full_name: string;
  status: 'connected' | 'disconnected' | 'access_revoked' | 'reauthorization_required';
  automatic: boolean;
}
export interface GithubSubmission {
  id: string;
  developer_project_id: string;
  tag: string;
  version: string;
  commit_sha: string;
  status: 'waiting' | 'queued' | 'running' | 'built' | 'needs_review' | 'approved' | 'rejected' | 'published' | 'failed' | 'cancelled';
  failure: string | null;
  retryable: boolean;
  source_digest: string | null;
  artifact_digest: string | null;
}
export interface SubmissionResponse { submission: GithubSubmission; build: object | null; review: object | null }
export interface RepositoryResponse { repository: GithubRepositoryConnection | null; console_url: string; tags?: Array<{name: string; commit: {sha: string}}> }
