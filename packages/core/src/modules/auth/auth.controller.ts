import { GetAuthUser, parseTimeToMs } from "../../common";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { Response as ExpressResponse } from "express";
import { LoginDto } from "./dto/login.dto";
import { JwtPayloadModel } from "./models/payload-jwt.model";
import { UserResponseDto } from "../users/dto/user-response.dto";
import {
  Controller,
  Post,
  Body,
  Request,
  Res,
  UseGuards,
  Get,
} from "@nestjs/common";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: ExpressResponse
  ) {
    const {
      expiresIn,
      refreshTokensEnabled,
      refreshTokenExpiry,
      cookieEnabled,
      cookieSameSite,
      cookieSecure,
      cookieHttpOnly,
      cookieName,
    } = await this.authService.getAuthConfig();

    const data = await this.authService.login(dto);

    if (cookieEnabled) {
      const maxAge =
        refreshTokensEnabled && refreshTokenExpiry
          ? parseTimeToMs(refreshTokenExpiry)
          : parseTimeToMs(expiresIn);

      res.cookie(cookieName || "session", JSON.stringify(data), {
        httpOnly: cookieHttpOnly ?? true,
        secure: cookieSecure ?? process.env["NODE_ENV"] === "production",
        sameSite: cookieSameSite || "strict",
        domain: "localhost",
        maxAge,
      });
    }

    return new AuthResponseDto(data);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@GetAuthUser() user: JwtPayloadModel) {
    const data = await this.authService.getAuthUser(user.sub);
    return new UserResponseDto(data);
  }
}
