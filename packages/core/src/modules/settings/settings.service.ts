import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { Setting, SettingDocument } from "./settings.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CacheService } from "../cache";
import { UserService } from "../users/services/users.service";
import { InitCmsModel } from "./models/init-cms.model";
import {
  CMS_SETTINGS_KEY,
  CmsSettingsModel,
} from "./models/cms-settings.model";
import { CORE_NAMESPACE } from "../../constants";

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
    private readonly cache: CacheService,
    private readonly userService: UserService
  ) {}

  /**
   * Generates a cache key based on the key.
   * @param key - The unique key of the setting.
   */
  private generateCacheKey(key: string): string {
    return `settings:${key}`;
  }

  /**
   * Retrieve a setting by namespace and key.
   * Checks the cache first before querying the database.
   */
  async findOne<T = Record<string, unknown>>(
    namespace: string,
    key: string
  ): Promise<Setting<T> | null> {
    const cacheKey = this.generateCacheKey(key);
    const cachedValue = await this.cache.get<Setting<T>>(namespace, cacheKey);

    if (cachedValue) return cachedValue;

    try {
      const setting = await this.settingModel
        .findOne({ namespace, key })
        .exec();

      if (setting) {
        const settingData = setting.toJSON() as unknown as Setting<T>;
        await this.cache.set(namespace, cacheKey, settingData);
        return settingData;
      }

      return null;
    } catch (error: unknown) {
      this.logger.error(
        `Error in findOne (namespace: ${namespace}, key: ${key}):`,
        error as Error
      );
      throw new InternalServerErrorException("Failed to retrieve the setting.");
    }
  }

  /**
   * Retrieve all settings, optionally filtered by namespace.
   */
  async findAll(namespace?: string): Promise<Setting[]> {
    try {
      const query = namespace ? { namespace } : {};
      const data = await this.settingModel.find(query).exec();
      return data.map((item) => item.toJSON());
    } catch (error: unknown) {
      this.logger.error(
        `Error in findAll (namespace: ${namespace}):`,
        error as Error
      );
      throw new InternalServerErrorException("Failed to retrieve settings.");
    }
  }

  /**
   * Create a new setting.
   * If the setting already exists, use `upsert` instead.
   */
  async create(settingData: Partial<Setting>): Promise<Setting> {
    try {
      if (!settingData.namespace || !settingData.key) {
        throw new InternalServerErrorException(
          "Namespace and key are required."
        );
      }

      const createdSetting = new this.settingModel(settingData);
      const savedSetting = await createdSetting.save();
      const settingDataJson = savedSetting.toJSON();

      const cacheKey = this.generateCacheKey(settingData.key);
      await this.cache.del(settingData.namespace, cacheKey);

      return settingDataJson as Setting;
    } catch (error: unknown) {
      this.logger.error(
        `Error in create (settingData: ${JSON.stringify(settingData)}):`,
        error as Error
      );
      throw new InternalServerErrorException("Failed to create the setting.");
    }
  }

  /**
   * Update an existing setting or create it if it does not exist.
   */
  async upsert(
    namespace: string,
    key: string,
    value: unknown
  ): Promise<Setting> {
    try {
      const updatedSetting = await this.settingModel
        .findOneAndUpdate(
          { namespace, key },
          { $set: { value } },
          { new: true, upsert: true }
        )
        .exec();

      const settingDataJson = updatedSetting.toJSON();

      const cacheKey = this.generateCacheKey(key);
      await this.cache.set(namespace, cacheKey, settingDataJson);

      return settingDataJson;
    } catch (error: unknown) {
      this.logger.error(
        `Error in upsert (namespace: ${namespace}, key: ${key}, value: ${value}):`,
        error as Error
      );
      throw new InternalServerErrorException("Failed to update the setting.");
    }
  }

  /**
   * Delete a setting by namespace and key.
   * Returns `false` if no matching setting was found.
   */
  async delete(namespace: string, key: string): Promise<boolean> {
    try {
      const result = await this.settingModel
        .deleteOne({ namespace, key })
        .exec();

      if (result.deletedCount && result.deletedCount > 0) {
        const cacheKey = this.generateCacheKey(key);
        await this.cache.del(namespace, cacheKey);
        return true;
      }
      return false;
    } catch (error: unknown) {
      this.logger.error(
        `Error in delete (namespace: ${namespace}, key: ${key}):`,
        error as Error
      );
      throw new InternalServerErrorException("Failed to delete the setting.");
    }
  }

  /**
   * Initializes the CMS with essential settings and creates the first admin user.
   *
   * This method ensures that the CMS is only initialized once by checking if settings already exist.
   * If settings are already present, it throws an error.
   *
   * @param {InitCmsModel} data - Initialization data containing site settings and admin details.
   * @throws {BadRequestException} If the CMS has already been initialized.
   * @returns {Promise<any>} The created CMS settings.
   */
  async initCms(data: InitCmsModel): Promise<any> {
    const namespace = CORE_NAMESPACE;
    const key = CMS_SETTINGS_KEY;

    const existingSetting = await this.settingModel
      .findOne({ namespace, key })
      .exec();
    if (existingSetting) {
      throw new BadRequestException("CMS has already been initialized.");
    }

    const { siteName, siteUrl, defaultLanguage, allowIndexing } = data;
    if (!siteName || !siteUrl || !defaultLanguage) {
      throw new BadRequestException("Missing required site settings.");
    }

    const adminUser = await this.userService.createUser({
      email: data.adminEmail,
      password: data.adminPassword,
      firstName: data.adminFirstName,
      lastName: data.adminLastName,
    });

    if (!adminUser) {
      throw new BadRequestException(
        "Failed to create the administrator account."
      );
    }

    const value: CmsSettingsModel = {
      siteName,
      siteUrl,
      siteDescription: data.siteDescription || "",
      defaultLanguage,
      allowIndexing: allowIndexing ?? true,
    };

    return await this.create({ namespace, key, value });
  }
}
