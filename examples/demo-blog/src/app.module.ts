import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CoreModule, yamlConfigLoader } from "@kitejs/core";
import { join } from "path";
import { AppController } from "./app.controller";
import { ServeStaticModule } from "@nestjs/serve-static";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        () =>
          yamlConfigLoader(
            join(process.cwd(), "examples/demo-blog/config.yaml")
          ),
      ],
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "/theme/assets"),
      serveRoot: "/assets",
    }),
    CoreModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
