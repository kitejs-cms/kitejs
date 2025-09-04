import { Injectable, Logger, Type } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { PluginDocument, Plugin } from "../plugin.schema";
import { IPlugin } from "../plugin.interface";
import { PluginStatus } from "../models/plugin-response.model";
import {
  PermissionsService,
  RolesService,
  PermissionResponseModel,
} from "../../users";
import { SettingsService, SettingType } from "../../settings";

@Injectable()
export class PluginsLoaderService {
  private readonly logger = new Logger(PluginsLoaderService.name);

  constructor(
    @InjectModel(Plugin.name)
    private readonly pluginModel: Model<PluginDocument>,
    private readonly permissionService: PermissionsService,
    private readonly roleService: RolesService,
    private readonly settingService: SettingsService
  ) {}

  /**
   * Loads and initializes all provided plugins.
   * - Skips disabled plugins.
   * - Skips plugins that previously failed.
   * - Initializes new plugins and updates their status.
   * If a plugin is not found in the database, it is created immediately.
   * @param plugins - Array of IPlugin instances.
   */
  async loadPlugins(plugins: IPlugin[]): Promise<Type<unknown>[]> {
    const pluginsModules: Type<unknown>[] = [];
    for (const pluginInstance of plugins) {
      try {
        let plugin = await this.pluginModel.findOne({
          namespace: pluginInstance.namespace,
        });

        // If the plugin is not found in the DB, create it immediately.
        if (!plugin) {
          plugin = await this.pluginModel.create({
            name: pluginInstance.name,
            namespace: pluginInstance.namespace,
            status: PluginStatus.PENDING,
            enabled: true,
          });

          this.logger.log(
            `Created plugin entry for ${pluginInstance.namespace} in the database.`
          );
        }

        if (!plugin.enabled) {
          this.logger.warn(
            `⚠️ Plugin ${pluginInstance.namespace} is disabled. Skipping.`
          );
          continue;
        }

        const isPending = plugin.status === PluginStatus.PENDING;

        if (isPending) {
          // Initialize the plugin
          await pluginInstance.initialize();

          // Create default settings if provided
          if (pluginInstance.settings) {
            for (const setting of pluginInstance.settings) {
              await this.settingService.create({
                namespace: pluginInstance.namespace,
                key: setting.key,
                value: setting.value,
                type:
                  pluginInstance.namespace === "core"
                    ? SettingType.CORE
                    : SettingType.PLUGIN,
              });
            }
          }
        }

        if (pluginInstance.permissions) {
          await this.syncPermissionsAndRoles(pluginInstance);
        }

        if (isPending) {
          // Update plugin status to INSTALLED
          await this.pluginModel.updateOne(
            { namespace: pluginInstance.namespace },
            {
              status: PluginStatus.INSTALLED,
              lastError: null,
              installedAt: new Date(),
            }
          );
          this.logger.log(
            `✅ Plugin ${pluginInstance.namespace} installed successfully.`
          );
        }

        pluginsModules.push(pluginInstance.getModule());
      } catch (error) {
        this.logger.error(
          `Failed to load plugin ${pluginInstance.namespace}: ${error}`
        );
        await this.pluginModel.updateOne(
          { namespace: pluginInstance.namespace },
          { status: PluginStatus.FAILED, lastError: error }
        );
      }
    }

    return pluginsModules;
  }

  private async syncPermissionsAndRoles(pluginInstance: IPlugin) {
    const existingPermissions = await this.permissionService.findPermissions(
      pluginInstance.namespace
    );
    let roles = await this.roleService.findRoles();

    for (const permission of pluginInstance.permissions ?? []) {
      let dbPermission = existingPermissions.find(
        (p) => p.name === permission.name
      ) as PermissionResponseModel | undefined;

      if (!dbPermission) {
        dbPermission = await this.permissionService.createPermission({
          namespace: pluginInstance.namespace,
          name: permission.name,
          description: permission.description,
        });

        existingPermissions.push(dbPermission);
      }

      for (const roleName of permission.role) {
        let role = roles.find((r) => r.name === roleName);

        if (!role) {
          const newRole = await this.roleService.createRole({
            name: roleName,
            permissions: [new Types.ObjectId(dbPermission.id)],
            source: 'system',
          });

          if (newRole) {
            roles.push(newRole);
            role = newRole;
          }
        } else {
          if (role.source !== 'system') {
            const updated = await this.roleService.updateRole(role.id, {
              source: 'system',
            });
            if (updated) Object.assign(role, updated);
          }

          if (!role.permissions.includes(dbPermission.name)) {
            const updatedRole = await this.roleService.assignPermissions(
              role.id,
              [dbPermission.id],
              true
            );
            Object.assign(role, updatedRole);
          }
        }
      }
    }
  }
}
