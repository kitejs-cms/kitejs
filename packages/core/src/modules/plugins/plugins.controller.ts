import { ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { PluginResponseDto } from "./dto/plugin-response.dto";
import { PluginsService } from "./services/plugins.service";
import { JwtAuthGuard } from "../auth";
import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";

@Controller("plugins")
export class PluginsController {
  constructor(private readonly pluginService: PluginsService) {}

  /**
   * Get a specific plugin by namespace.
   * @param namespace - The namespace of the plugin.
   */
  @Get(":namespace")
  async getPlugin(
    @Param("namespace") namespace: string
  ): Promise<PluginResponseDto> {
    const data = await this.pluginService.findOne(namespace);

    if (!data)
      throw new NotFoundException(
        `Plugin with namespace: "${namespace}" not found.`
      );

    return new PluginResponseDto(data);
  }

  /**
   * Get all registered plugins, optionally filtered by enabled status.
   * @param enabledOnly - (Optional) If true, returns only enabled plugins.
   */
  @Get()
  @ApiQuery({
    name: "enabledOnly",
    required: false,
    type: Boolean,
    description: "If true, returns only enabled plugins",
  })
  async getAllPlugins(
    @Query("enabledOnly") enabledOnly?: string
  ): Promise<PluginResponseDto[]> {
    const isEnabled = enabledOnly === "true";
    const data = await this.pluginService.findAll(isEnabled);
    return data.map((plugin) => new PluginResponseDto(plugin));
  }

  /**
   * Disable a plugin by setting `enabled` to false.
   * @param namespace - The namespace of the plugin to disable.
   */
  @Post(":namespace/disable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async disablePlugin(
    @Param("namespace") namespace: string
  ): Promise<{ success: boolean }> {
    const disabled = await this.pluginService.disable(namespace);
    return { success: disabled };
  }
}
