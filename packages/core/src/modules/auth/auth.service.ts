import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { UserService } from "../users/services/users.service";
import { SettingsService } from "../settings/settings.service";
import { LoginDto } from "./dto/login.dto";
import { CORE_NAMESPACE } from "../../constants";
import { JwtPayloadModel } from "./models/payload-jwt.model";
import { parseTimeToMs } from "../../common";
import { AUTH_SETTINGS_KEY, AuthSettingsModel } from "../settings";
import { ChangePasswordDto } from "./dto/change-password.dto";
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly settingService: SettingsService
  ) {}

  async getAuthConfig() {
    const authConfig = await this.settingService.findOne<AuthSettingsModel>(
      CORE_NAMESPACE,
      AUTH_SETTINGS_KEY
    );

    if (!authConfig) {
      throw new InternalServerErrorException(
        `Not found settings: ${AUTH_SETTINGS_KEY}`
      );
    }

    return authConfig.value;
  }

  /**
   * Validates a user by comparing the provided password with the stored hash using Argon2.
   * Handles failed login attempts, account locking, and resets based on settings.
   * @param dto The user's email & password.
   * @param config The AuthSettingsModel.
   * @returns The user object (excluding the password) if validation is successful, otherwise throws an exception.
   */
  async validateUser(
    { email, password }: LoginDto,
    { loginAttemptResetTime, maxLoginAttempts }: AuthSettingsModel
  ): Promise<any> {
    const user = await this.userService.findUser(email);
    const now = new Date();

    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    if (loginAttemptResetTime && maxLoginAttempts && user.loginAttempts) {
      const count = parseInt(user.loginAttempts.split("_")[0]);
      const lastAttempt = new Date(user.loginAttempts.split("_")[1]);

      const resetTimeMs = parseTimeToMs(loginAttemptResetTime);
      const resetDate = new Date(lastAttempt.getTime() + resetTimeMs);

      if (now < resetDate && count >= maxLoginAttempts) {
        throw new UnauthorizedException(
          `Account is locked until ${resetDate.toLocaleString()}`
        );
      }
    }

    // Validate the password
    if (!(await argon2.verify(user.password as string, password))) {
      // Increment login attempts if the password is invalid
      if (loginAttemptResetTime && maxLoginAttempts) {
        let loginAttempts = `1_${now.toISOString()}`;

        if (user.loginAttempts) {
          const count = parseInt(user.loginAttempts.split("_")[0]);
          loginAttempts = `${count + 1}_${now.toISOString()}`;
        }

        await this.userService.updateUser(user.id, { loginAttempts });
      }
      throw new UnauthorizedException("Invalid email or password.");
    }

    // Reset login attempts after successful authentication
    if (loginAttemptResetTime && maxLoginAttempts && user.loginAttempts) {
      await this.userService.updateUser(user.id, { loginAttempts: null });
    }

    return user;
  }

  /**
   * Logs in a user by generating a JWT access token and optionally a refresh token.
   * @param user The authenticated user object.
   * @returns An object containing the generated access token and optionally a refresh token.
   */
  async login(dto: LoginDto) {
    // Retrieve authentication settings
    const authConfig = await this.getAuthConfig();

    const {
      expiresIn,
      refreshTokensEnabled,
      refreshTokenExpiry,
      allowedDomains,
    } = authConfig;

    const user = await this.validateUser(dto, authConfig);

    const payload: JwtPayloadModel = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
      permissions: user.permissions,
    };

    // Validate allowed domains
    if (allowedDomains?.length) {
      const userDomain = user.email.split("@")[1];
      if (!allowedDomains.includes(userDomain)) {
        throw new UnauthorizedException(`Domain ${userDomain} is not allowed.`);
      }
    }

    const accessToken = this.jwtService.sign(payload, { expiresIn });

    let refreshToken = null;
    if (refreshTokensEnabled) {
      refreshToken = this.jwtService.sign(payload, {
        expiresIn: refreshTokenExpiry,
      });
    }

    return {
      accessToken,
      ...(refreshTokensEnabled && { refreshToken }),
    };
  }

  /**
   * Retrieves the authenticated user based on the provided user ID.
   *
   * This method queries the `UserService` to find and return the user
   * associated with the given `id`. It is typically used to fetch the details
   * of a user after authentication or to validate session-based access.
   *
   * @param id The unique identifier of the user.
   * @returns A promise that resolves to the user object if found.
   */
  async getAuthUser(id: string) {
    return this.userService.findUser(id);
  }

  /**
   * Changes the password of an authenticated user.
   * This method ensures that the old password is correct before updating to a new password.
   *
   * @param userId - The ID of the authenticated user.
   * @param changePasswordDto - DTO containing old and new password.
   * @throws {BadRequestException} If the old password is incorrect or update fails.
   * @returns A success message if the password is updated.
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto
  ) {
    const { oldPassword, newPassword } = changePasswordDto;

    const user = await this.userService.findUser(userId);
    if (!user) {
      throw new BadRequestException("User not found.");
    }

    const isPasswordValid = await argon2.verify(
      user.password as string,
      oldPassword
    );
    if (!isPasswordValid) {
      throw new BadRequestException("Old password is incorrect.");
    }

    if (await argon2.verify(user.password as string, newPassword)) {
      throw new BadRequestException(
        "New password cannot be the same as the old password."
      );
    }

    const hashedPassword = await argon2.hash(newPassword);
    await this.userService.updateUser(userId, { password: hashedPassword });

    return { updatedAt: new Date() };
  }
}
