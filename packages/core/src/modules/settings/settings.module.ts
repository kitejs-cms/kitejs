import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Setting, SettingSchema } from "./settings.schema";
import { SettingsService } from "./settings.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Setting.name, schema: SettingSchema }]),
  ],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
