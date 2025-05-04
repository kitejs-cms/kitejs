import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { JwtModule } from "@nestjs/jwt";
import { SettingsModule } from "../settings/settings.module";
import { ConfigService } from "@nestjs/config";
import { UsersModule } from "../users";

@Module({
  imports: [
    UsersModule,
    SettingsModule,
    JwtModule.registerAsync({
      useFactory: async (config: ConfigService) => {
        const secret = config.get<string>("API_SECRET");

        if (!secret) {
          throw new Error(
            "JWT secret is not defined. Please set 'security.secret' in your config file."
          );
        }

        return {
          secret,
          signOptions: { expiresIn: "1h" },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
