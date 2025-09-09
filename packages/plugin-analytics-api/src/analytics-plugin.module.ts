import { Module } from "@nestjs/common";
import { AnalyticsModule } from "./analytics";

@Module({
  imports: [AnalyticsModule],
})
export class AnalyticsPluginModule {}
