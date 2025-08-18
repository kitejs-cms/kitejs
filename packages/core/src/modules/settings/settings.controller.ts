import { InitCmsDto } from "./dto/init-cms.dto";
import { SettingsService } from "./settings.service";
import { SettingResponseDto } from "./dto/setting-response.dto";
import { ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import {
  Controller,
  Get,
  Param,
  Body,
  Put,
  Delete,
  Query,
  NotFoundException,
  Post,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

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
    @Query("namespace") namespace?: string
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
  @Put(":namespace/:key")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        value: {
          type: "object",
          example: { itemsPerPage: 10 },
        },
      },
      required: ["value"],
    },
  })
  async upsertSetting(
    @Param("namespace") namespace: string,
    @Param("key") key: string,
    @Body("value") value: unknown
  ): Promise<SettingResponseDto> {
    let parsedValue = value;
    if (typeof value === "string") {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        throw new BadRequestException("Invalid JSON for value");
      }
    }

    const data = await this.settingsService.upsert(namespace, key, parsedValue);

    return new SettingResponseDto(data);
  }

  /**
   * Initializes the CMS with essential settings and creates the first admin user.
   * @param dto - The initialization data.
   * @returns The created CMS settings.
   */
  @Post("init-cms")
  async initCms(@Body() dto: InitCmsDto) {
    const data = await this.settingsService.initCms(dto);

    return new SettingResponseDto(data);
  }

  /**
   * Delete a setting by namespace and key.
   * @param namespace - The namespace of the setting.
   * @param key - The unique key of the setting within the namespace.
   */
  @Delete(":namespace/:key")
  @UseGuards(AuthGuard("jwt"))
  @ApiBearerAuth()
  async deleteSetting(
    @Param("namespace") namespace: string,
    @Param("key") key: string
  ): Promise<{ success: boolean }> {
    const deleted = await this.settingsService.delete(namespace, key);
    return { success: deleted };
  }
}
