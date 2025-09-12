import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { SettingsService } from "@kitejs-cms/core";
import type { AnalyticsPluginSettingsModel } from "../models/analytics-plugin-settings.model";
import {
  ANALYTICS_PLUGIN_NAMESPACE,
  ANALYTICS_SETTINGS_KEY,
} from "../../constants";

@Injectable()
export class AnalyticsApiKeyGuard implements CanActivate {
  constructor(private readonly settingsService: SettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers["x-api-key"] as string | undefined;
    const { value } =
      await this.settingsService.findOne<AnalyticsPluginSettingsModel>(
        ANALYTICS_PLUGIN_NAMESPACE,
        ANALYTICS_SETTINGS_KEY
      );
    if (!apiKey || apiKey !== value?.apiKey) {
      throw new UnauthorizedException("Invalid API key");
    }
    return true;
  }
}
