import { Injectable } from "@nestjs/common";
import { Setting, SettingDocument } from "./settings.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>
  ) {}

  /**
   * Retrieve a setting by namespace and key.
   * Returns `null` if the setting is not found.
   * @param namespace - The namespace for the setting (e.g., plugin name).
   * @param key - The unique key of the setting within the namespace.
   */
  async findOne(namespace: string, key: string): Promise<Setting | null> {
    return this.settingModel.findOne({ namespace, key }).exec();
  }

  /**
   * Retrieve all settings, optionally filtered by namespace.
   * Useful for fetching configurations for a specific plugin, theme, or global context.
   * @param namespace - (Optional) Namespace to filter settings by.
   */
  async findAll(namespace?: string): Promise<Setting[]> {
    const query = namespace ? { namespace } : {};
    return this.settingModel.find(query).exec();
  }

  /**
   * Create a new setting.
   * If the setting already exists, use `upsert` instead.
   * @param settingData - Partial setting data to create the document.
   */
  async create(settingData: Partial<Setting>): Promise<Setting> {
    const createdSetting = new this.settingModel(settingData);
    return createdSetting.save();
  }

  /**
   * Update an existing setting or create it if it does not exist.
   * This is useful for plugins or themes that need to initialize default configurations.
   * @param namespace - The namespace for the setting (e.g., plugin name).
   * @param key - The unique key of the setting within the namespace.
   * @param value - The value to set for the setting.
   */
  async upsert(namespace: string, key: string, value: any): Promise<Setting> {
    return this.settingModel
      .findOneAndUpdate(
        { namespace, key },
        { $set: { value } },
        { new: true, upsert: true }
      )
      .exec();
  }

  /**
   * Delete a setting by namespace and key.
   * Returns `false` if no matching setting was found.
   * @param namespace - The namespace for the setting (e.g., plugin name).
   * @param key - The unique key of the setting within the namespace.
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    const result = await this.settingModel.deleteOne({ namespace, key }).exec();
    return result.deletedCount > 0;
  }
}
