export enum PluginStatus {
  PENDING = "pending",
  INSTALLED = "installed",
  FAILED = "failed",
}

export type PluginResponseModel = {
  id: string;
  name: string;
  namespace: string;
  version: string;
  enabled: boolean;
  pendingDisable: boolean;
  requiresRestart: boolean;
  installedAt: Date;
  updatedAt: Date;
  author?: string;
  description?: string;
  dependencies: string[];
  status: PluginStatus;
  lastError: string | null;
};
