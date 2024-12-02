import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CoreModule, yamlConfigLoader } from "@kitejs/core";
import { join } from "path";

@Module({
  imports: [
    CoreModule,
    ConfigModule.forRoot({
      load: [
        () =>
          yamlConfigLoader(
            join(process.cwd(), "examples/demo-blog/config.yaml")
          ),
      ],
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
