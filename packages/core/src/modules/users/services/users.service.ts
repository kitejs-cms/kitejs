import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User } from "../schemas/user.schema";
import { UserStatus } from "../models/user-status.enum";
import { Role } from "../schemas/role.schema";
import { Permission } from "../schemas/permission.schema";
import { UserResponseModel } from "../models/user-response.model";
import { UpdateUserModel } from "../models/update-user.model";
import { CreateUserModel } from "../models/create-user.model";
import { PermissionsService } from "./permissions.service";
import { RolesService } from "./roles.service";
import argon2 from "argon2";

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly permissionService: PermissionsService,
    private readonly roleService: RolesService
  ) {}

  /**
   * Creates a new user.
   * @param userData Data for the new user.
   * @returns The created user.
   * @throws BadRequestException if the user cannot be created.
   */
  async createUser(
    userData: CreateUserModel
  ): Promise<UserResponseModel | null> {
    try {
      const user = new this.userModel(userData);
      await user.save();

      return this.findUser(userData.email);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to create the user. ${errorMessage}`
      );
    }
  }

  /**
   * Counts the total number of users, optionally filtered by status.
   * @param status Optional status to filter users.
   * @returns The total number of matching users.
   */
  async countUsers(status?: string): Promise<number> {
    try {
      const query = status ? { status, deletedAt: null } : { deletedAt: null };
      return await this.userModel.countDocuments(query).exec();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to count users. ${errorMessage}`);
    }
  }

  /**
   * Retrieves all users based on optional status filter and pagination.
   * @param page Page number for pagination (default: 1).
   * @param itemsPerPage Number of items per page (default: 10).
   * @param status Optional status to filter users.
   * @returns A paginated result with users and their permissions/roles.
   */
  async findUsers(
    page = 1,
    itemsPerPage = 10,
    status?: UserStatus
  ): Promise<UserResponseModel[]> {
    try {
      const query = status ? { status, deletedAt: null } : { deletedAt: null };
      const skip = (page - 1) * itemsPerPage;

      const users = await this.userModel
        .find(query)
        .skip(skip)
        .limit(itemsPerPage)
        .populate<{
          roles: Role[];
          permissions: Permission[];
        }>("roles permissions")
        .exec();

      const data: UserResponseModel[] = users.map((user) => {
        const jsonUser = user.toJSON();

        const roles: string[] = jsonUser.roles.map((role: Role) => role.name);
        const permissions: string[] = jsonUser.permissions.map(
          (permission: Permission) => permission.name
        );

        return { ...jsonUser, roles, permissions } as UserResponseModel;
      });

      return data;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch users. ${errorMessage}`);
    }
  }

  /**
   * Retrieves a user by a unique identifier, which can be an ID or an email.
   * @param identify The unique identifier (ID or email).
   * @returns The user or `null` if not found.
   */
  async findUser(identify: string): Promise<UserResponseModel | null> {
    try {
      const isObjectId = Types.ObjectId.isValid(identify);

      const query = isObjectId
        ? { _id: identify }
        : { email: { $regex: new RegExp(`^${identify}$`, "i") } };

      const user = await this.userModel
        .findOne(query)
        .populate<{
          roles: Role[];
          permissions: Permission[];
        }>("roles permissions")
        .exec();

      if (user) {
        const jsonUser = user.toJSON();
        const roles = jsonUser.roles.map((role) => role.name);

        const permissions = jsonUser.permissions.map(
          (permission) => permission.name
        );

        return { ...jsonUser, roles, permissions } as UserResponseModel;
      }

      return null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch the user. ${errorMessage}`
      );
    }
  }

  /**
   * Updates a user.
   * @param id The user ID.
   * @param updateData Data to update.
   * @returns The updated user or `null` if not found.
   * @throws BadRequestException if the update fails.
   */
  async updateUser(
    id: string,
    updateData: UpdateUserModel
  ): Promise<UserResponseModel | null> {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      return this.findUser(id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to update the user. ${errorMessage}`
      );
    }
  }

  /**
   * Deletes a user.
   * @param id The user ID.
   * @returns `true` if the user was deleted, `false` otherwise.
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      const result = await this.userModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to delete the user. ${errorMessage}`
      );
    }
  }

  /**
   * Updates user consents.
   * @param userId The user ID.
   * @param consents Array of consents to update.
   * @returns The updated user or `null` if not found.
   * @throws BadRequestException if the update fails.
   */
  async updateUserConsents(
    userId: string,
    consents: Array<{ consentType: string; given: boolean }>
  ): Promise<UserResponseModel | null> {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(
          userId,
          {
            $set: {
              consents: consents.map((c) => ({
                ...c,
                timestamp: new Date(),
              })),
            },
          },
          { new: true }
        )
        .exec();

      return this.findUser(userId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to update user consents. ${errorMessage}`
      );
    }
  }

  /**
   * Assign a permission to a user by ID or symbolic name.
   * @param userId - User ID
   * @param permissions - Permission ID or symbolic name
   */
  async assignPermission(userId: string, permissions: string[]) {
    try {
      const allPermissions = await this.permissionService.findPermissions();

      const validPermissions = allPermissions.filter(
        (perm) =>
          permissions.includes(perm.id) || permissions.includes(perm.name)
      );

      await this.userModel.findByIdAndUpdate(
        userId,
        { $addToSet: { permissions: validPermissions.map((item) => item.id) } },
        { new: true }
      );

      return this.findUser(userId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to update user permissions. ${errorMessage}`
      );
    }
  }

  /**
   * Assign roles to a user by ID or symbolic name.
   * @param userId - User ID
   * @param roles - Array of Role IDs or symbolic names
   * @throws BadRequestException if no valid roles are found
   */
  async assignRoles(userId: string, roles: string[]) {
    try {
      const allRoles = await this.roleService.findRoles();

      const validRoles = allRoles.filter(
        (role) => roles.includes(role.id) || roles.includes(role.name)
      );

      await this.userModel.findByIdAndUpdate(
        userId,
        { $addToSet: { roles: validRoles.map((role) => role.id) } },
        { new: true }
      );

      return this.findUser(userId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to update user roles. ${errorMessage}`
      );
    }
  }

  /**
   * Updates the user's password.
   * @param userId - User ID
   * @param newPassword - New password (plain text)
   * @throws BadRequestException if the update fails
   * @returns Updated user or null if not found
   */
  async updateUserPassword(
    userId: string,
    newPassword: string
  ): Promise<UserResponseModel | null> {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new BadRequestException(
          "Password must be at least 6 characters long."
        );
      }

      const hashedPassword = await argon2.hash(newPassword);

      await this.userModel
        .findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
        .exec();

      return this.findUser(userId);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to update password. ${errorMessage}`
      );
    }
  }
}
