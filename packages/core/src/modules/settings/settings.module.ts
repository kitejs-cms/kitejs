import { Module, forwardRef } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { Setting, SettingSchema } from "./settings.schema";
import { SettingsService } from "./settings.service";
import { CacheModule } from "../cache/cache.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Setting.name, schema: SettingSchema }]),
    CacheModule,
    forwardRef(() => UsersModule),
  ],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
