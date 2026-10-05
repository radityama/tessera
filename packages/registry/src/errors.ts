export type RegistryErrorCode =
  "REGISTRY_IO" | "REGISTRY_JSON" | "REGISTRY_INVALID";

export interface RegistryIssue {
  path: Array<string | number>;
  message: string;
}

export class RegistryError extends Error {
  readonly code: RegistryErrorCode;
  readonly issues: RegistryIssue[];

  constructor(
    code: RegistryErrorCode,
    message: string,
    issues: RegistryIssue[] = [],
  ) {
    super(message);
    this.name = "RegistryError";
    this.code = code;
    this.issues = issues;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      issues: this.issues,
    };
  }
}
