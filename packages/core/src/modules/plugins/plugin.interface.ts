import { Type } from "@nestjs/common";
import { SettingModel } from "../settings/models/setting.model";
import { PermissionModel } from "../users";

export interface IPlugin {
  /**
   * Unique namespace for the plugin (must match the one in the database).
   */
  namespace: string;

  /**
   * Name of the plugin (human-readable).
   */
  name: string;

  /**
   * Version of the plugin (SemVer format).
   */
  version: string;

  /**
   * Description of what the plugin does.
   */
  description?: string;

  /**
   * Whether the plugin is enabled. Disabled plugins are skipped.
   * Defaults to `true` when omitted.
   */
  enabled?: boolean;

  /**
   * Default settings required for this plugin.
   * These will be inserted in the database if they don't exist.
   */
  settings?: SettingModel[];

  /**
   * Default permissions and roles required by the plugin.
   * These will be inserted in the database if they don't exist.
   */
  permissions?: PermissionModel[];

  /**
   * Called when the plugin is initialized.
   * This function can be async and will be executed during the setup.
   */
  initialize(): Promise<void>;

  /**
   * Returns the NestJS module that should be loaded by the core system.
   * This allows each plugin to provide its own module dynamically.
   */
  getModule(): Type<unknown>;
}
