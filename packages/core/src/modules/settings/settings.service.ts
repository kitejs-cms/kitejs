import {
  Injectable,
  InternalServerErrorException,
  Inject,
} from "@nestjs/common";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import { Setting, SettingDocument } from "./settings.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  /**
   * Retrieve a setting by namespace and key.
   * Checks the cache first before querying the database.
   * @param namespace - The namespace for the setting (e.g., plugin name).
   * @param key - The unique key of the setting within the namespace.
   */
  async findOne(namespace: string, key: string): Promise<Setting | null> {
    const cacheKey = `settings_${namespace}:${key}`;

    const cachedValue = await this.cacheManager.get<Setting>(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }

    try {
      const setting = await this.settingModel
        .findOne({ namespace, key })
        .exec();
      if (setting) {
        await this.cacheManager.set(cacheKey, setting); // Save to cache
      }
      return setting;
    } catch (error) {
      throw new InternalServerErrorException("Failed to retrieve the setting.");
    }
  }

  /**
   * Retrieve all settings, optionally filtered by namespace.
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
    try {
      const createdSetting = new this.settingModel(settingData);
      const savedSetting = await createdSetting.save();

      // Invalidate cache for the namespace
      const cacheKey = `settings_${settingData.namespace}:${settingData.key}`;
      await this.cacheManager.del(cacheKey);

      return savedSetting;
    } catch (error) {
      throw new InternalServerErrorException("Failed to create the setting.");
    }
  }

  /**
   * Update an existing setting or create it if it does not exist.
   * This is useful for plugins or themes that need to initialize default configurations.
   * @param namespace - The namespace for the setting (e.g., plugin name).
   * @param key - The unique key of the setting within the namespace.
   * @param value - The value to set for the setting.
   */
  async upsert(namespace: string, key: string, value: any): Promise<Setting> {
    try {
      const updatedSetting = await this.settingModel
        .findOneAndUpdate(
          { namespace, key },
          { $set: { value } },
          { new: true, upsert: true }
        )
        .exec();

      const cacheKey = `settings_${namespace}:${key}`;
      await this.cacheManager.set(cacheKey, updatedSetting);

      return updatedSetting;
    } catch (error) {
      throw new InternalServerErrorException("Failed to update the setting.");
    }
  }

  /**
   * Delete a setting by namespace and key.
   * Returns `false` if no matching setting was found.
   * @param namespace - The namespace for the setting (e.g., plugin name).
   * @param key - The unique key of the setting within the namespace.
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    try {
      const result = await this.settingModel
        .deleteOne({ namespace, key })
        .exec();
      if (result.deletedCount > 0) {
        const cacheKey = `settings_${namespace}:${key}`;
        await this.cacheManager.del(cacheKey);
        return true;
      }
      return false;
    } catch (error) {
      throw new InternalServerErrorException("Failed to delete the setting.");
    }
  }
}
