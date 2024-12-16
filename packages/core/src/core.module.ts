import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersModule } from "./modules/users/users.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ResponseInterceptor } from "./interceptors/response.interceptor";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.register({
      isGlobal: true,
      ttl: 3600, // 60 minutes (3600 seconds)
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("database.uri"),
        dbName: configService.get<string>("database.dbName"),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
  exports: [],
})
export class CoreModule {}
