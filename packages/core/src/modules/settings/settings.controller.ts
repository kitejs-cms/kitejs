import { SettingsService } from './settings.service';
import { SettingResponseDto } from './dto/setting-response.dto';
import {
  Controller,
  Get,
  Param,
  Body,
  Put,
  Delete,
  Query,
  NotFoundException,
} from '@nestjs/common';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Get a specific setting by namespace and key.
   * @param namespace - The namespace of the setting.
   * @param key - The unique key of the setting within the namespace.
   */
  @Get(':namespace/:key')
  async getSetting(
    @Param('namespace') namespace: string,
    @Param('key') key: string
  ): Promise<SettingResponseDto | null> {
    const data = await this.settingsService.findOne(namespace, key);

    if (!data)
      throw new NotFoundException(`Permission with Key: "${key}" not found.`);

    return new SettingResponseDto(data);
  }

  /**
   * Get all settings, optionally filtered by namespace.
   * @param namespace - (Optional) Namespace to filter settings by.
   */
  @Get()
  async getAllSettings(
    @Query('namespace') namespace?: string
  ): Promise<SettingResponseDto[]> {
    const data = await this.settingsService.findAll(namespace);

    return data.map((item) => new SettingResponseDto(item));
  }

  /**
   * Update or create a setting (upsert).
   * @param namespace - The namespace of the setting.
   * @param key - The unique key of the setting within the namespace.
   * @param body - The value to update or create for the setting.
   */
  @Put(':namespace/:key')
  async upsertSetting(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
    @Body('value') value: string
  ): Promise<SettingResponseDto> {
    const data = await this.settingsService.upsert(namespace, key, value);

    return new SettingResponseDto(data);
  }

  /**
   * Delete a setting by namespace and key.
   * @param namespace - The namespace of the setting.
   * @param key - The unique key of the setting within the namespace.
   */
  @Delete(':namespace/:key')
  async deleteSetting(
    @Param('namespace') namespace: string,
    @Param('key') key: string
  ): Promise<{ success: boolean }> {
    const deleted = await this.settingsService.delete(namespace, key);
    return { success: deleted };
  }
}
