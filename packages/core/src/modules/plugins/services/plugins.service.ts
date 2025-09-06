import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Plugin, PluginDocument } from "../plugin.schema";
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { PluginResponseModel } from "../models/plugin-response.model";
import { SettingsService, PLUGINS_RESTART_REQUIRED_KEY } from "../../settings";
import { CORE_NAMESPACE } from "../../../constants";

@Injectable()
export class PluginsService {
  private readonly logger = new Logger(PluginsService.name);

  constructor(
    @InjectModel(Plugin.name)
    private readonly pluginModel: Model<PluginDocument>,
    private readonly settingsService: SettingsService
  ) {}

  /**
   * Retrieves a plugin by its namespace.
   * @param namespace - The unique namespace of the plugin.
   * @returns The plugin document or null if not found.
   */
  async findOne(namespace: string): Promise<PluginResponseModel | null> {
    try {
      return await this.pluginModel.findOne({ namespace }).exec();
    } catch (error: unknown) {
      this.logger.error(
        `Error in findOne (namespace: ${namespace}):`,
        error as Error
      );
      throw new InternalServerErrorException('Failed to retrieve the plugin.');
    }
  }

  /**
   * Retrieves all registered plugins.
   * @param enabledOnly - If true, returns only enabled plugins.
   * @returns A list of all plugins.
   */
  async findAll(enabledOnly = false): Promise<PluginResponseModel[]> {
    try {
      const query = enabledOnly ? { enabled: true } : {};
      const data = await this.pluginModel.find(query).exec();

      return data.map((item) => item.toJSON());
    } catch (error: unknown) {
      this.logger.error(`Error in findAll:`, error as Error);
      throw new InternalServerErrorException('Failed to retrieve plugins.');
    }
  }

  /**
   * Registers a new plugin.
   * If the plugin already exists, it updates the existing entry.
   * @param pluginData - The plugin data to be saved.
   * @returns The created or updated plugin document.
   */
  async register(pluginData: Partial<PluginResponseModel>): Promise<Plugin> {
    try {
      if (!pluginData.namespace) {
        throw new InternalServerErrorException('Namespace is required.');
      }

      const registeredPlugin = await this.pluginModel.findOneAndUpdate(
        { namespace: pluginData.namespace },
        { $set: pluginData },
        { new: true, upsert: true }
      );

      return registeredPlugin.toJSON() as Plugin;
    } catch (error: unknown) {
      this.logger.error(
        `Error in register (pluginData: ${JSON.stringify(pluginData)}):`,
        error as Error
      );
      throw new InternalServerErrorException('Failed to register the plugin.');
    }
  }

  /**
   * Updates an existing plugin.
   * @param namespace - The namespace of the plugin to be updated.
   * @param updateData - The new data to be set.
   * @returns The updated plugin document.
   */
  async update(
    namespace: string,
    updateData: Partial<Plugin>
  ): Promise<Plugin> {
    try {
      const updatedPlugin = await this.pluginModel.findOneAndUpdate(
        { namespace },
        { $set: updateData },
        { new: true }
      );

      if (!updatedPlugin) {
        throw new InternalServerErrorException(
          `Plugin ${namespace} not found.`
        );
      }

      return updatedPlugin.toJSON() as Plugin;
    } catch (error: unknown) {
      this.logger.error(
        `Error in update (namespace: ${namespace}):`,
        error as Error
      );
      throw new InternalServerErrorException('Failed to update the plugin.');
    }
  }

  /**
   * Disables a plugin by setting `enabled` to false and flags the CMS
   * for a manual restart through settings.
   * @param namespace - The namespace of the plugin to be disabled.
   * @returns True if the plugin was successfully disabled, false otherwise.
   */
  async disable(namespace: string): Promise<boolean> {
    try {
      const result = await this.pluginModel.updateOne(
        { namespace },
        { $set: { enabled: false } }
      );

      if (result.modifiedCount > 0) {
        await this.settingsService.upsert(
          CORE_NAMESPACE,
          PLUGINS_RESTART_REQUIRED_KEY,
          true
        );
        return true;
      }
      return false;
    } catch (error: unknown) {
      this.logger.error(
        `Error in disable (namespace: ${namespace}):`,
        error as Error
      );
      throw new InternalServerErrorException("Failed to disable the plugin.");
    }
  }

  /**
   * Deletes a plugin by namespace.
   * @param namespace - The namespace of the plugin to be deleted.
   * @returns True if the plugin was deleted, false otherwise.
   */
  async delete(namespace: string): Promise<boolean> {
    try {
      const result = await this.pluginModel.deleteOne({ namespace }).exec();

      return result.deletedCount > 0;
    } catch (error: unknown) {
      this.logger.error(
        `Error in delete (namespace: ${namespace}):`,
        error as Error
      );
      throw new InternalServerErrorException('Failed to delete the plugin.');
    }
  }
}
