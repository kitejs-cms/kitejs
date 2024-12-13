import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
} from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { Setting } from "./settings.schema";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get a specific setting by namespace and key.
   * @param namespace - The namespace of the setting.
   * @param key - The unique key of the setting within the namespace.
   */
  @Get(":namespace/:key")
  async getSetting(
    @Param("namespace") namespace: string,
    @Param("key") key: string
  ): Promise<Setting | null> {
    return this.settingsService.findOne(namespace, key);
  }

  /**
   * Get all settings, optionally filtered by namespace.
   * @param namespace - (Optional) Namespace to filter settings by.
   */
  @Get()
  async getAllSettings(
    @Query("namespace") namespace?: string
  ): Promise<Setting[]> {
    return this.settingsService.findAll(namespace);
  }

  /**
   * Update or create a setting (upsert).
   * @param namespace - The namespace of the setting.
   * @param key - The unique key of the setting within the namespace.
   * @param body - The value to update or create for the setting.
   */
  @Put(":namespace/:key")
  async upsertSetting(
    @Param("namespace") namespace: string,
    @Param("key") key: string,
    @Body("value") value: any
  ): Promise<Setting> {
    return this.settingsService.upsert(namespace, key, value);
  }

  /**
   * Delete a setting by namespace and key.
   * @param namespace - The namespace of the setting.
   * @param key - The unique key of the setting within the namespace.
   */
  @Delete(":namespace/:key")
  async deleteSetting(
    @Param("namespace") namespace: string,
    @Param("key") key: string
  ): Promise<{ success: boolean }> {
    const deleted = await this.settingsService.delete(namespace, key);
    return { success: deleted };
  }
}
