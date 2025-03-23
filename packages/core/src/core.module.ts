import { Module, DynamicModule, Type } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { DatabaseModule, ResponseInterceptor } from "./common";
import { CacheModule } from "./modules/cache";
import { SettingsModule } from "./modules/settings";
import { UsersModule } from "./modules/users";
import { AuthModule } from "./modules/auth";
import { PluginsModule } from "./modules/plugins";
import { StorageModule } from "./modules/storage/storage.module";
import "multer";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    DatabaseModule.register(),
    CacheModule,
    SettingsModule,
    UsersModule,
    AuthModule,
    PluginsModule,
    StorageModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class CoreModule {
  static register(extraModules: Array<Type<unknown>> = []): DynamicModule {
    return {
      module: CoreModule,
      imports: [...extraModules],
    };
  }
}
