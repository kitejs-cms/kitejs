import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { SettingsModule, UsersModule } from "@kitejs-cms/core";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import {
  AnalyticsEvent,
  AnalyticsEventSchema,
} from "./schemas/analytics-event.schema";
import { AnalyticsApiKeyGuard } from "./guards/api-key.guard";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
    ]),
    SettingsModule,
    UsersModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsApiKeyGuard],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
