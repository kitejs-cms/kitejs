export interface PluginMigration {
  /**
   * Target version for this migration (SemVer).
   */
  version: string;
  /**
    * Execute changes required to upgrade to the target version.
    */
  up(): Promise<void>;
  /**
    * Revert the changes applied by `up`.
    */
  down(): Promise<void>;
}
