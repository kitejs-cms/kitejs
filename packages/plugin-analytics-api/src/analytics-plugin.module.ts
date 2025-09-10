import { Module } from "@nestjs/common";
import { AnalyticsModule } from "./analytics";
import { SettingsModule } from "@kitejs-cms/core";

@Module({
  imports: [AnalyticsModule],
})
export class AnalyticsPluginModule {}
