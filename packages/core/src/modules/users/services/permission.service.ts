import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Permission } from "../schemas/permission.schema";

@Injectable()
export class PermissionService {
  constructor(
    @InjectModel(Permission.name) private permissionModel: Model<Permission>
  ) {}

  /**
   * Creates a new permission.
   * @param permissionData Data for the new permission.
   * @returns The created permission.
   * @throws BadRequestException if the permission cannot be created.
   */
  async createPermission(
    permissionData: Partial<Permission>
  ): Promise<Permission> {
    try {
      const permission = new this.permissionModel(permissionData);
      return await permission.save();
    } catch (error) {
      throw new BadRequestException("Failed to create the permission.");
    }
  }

  /**
   * Retrieves all permissions.
   * @returns An array of permissions.
   */
  async findPermissions(): Promise<Permission[]> {
    return await this.permissionModel.find().exec();
  }

  /**
   * Retrieves a permission by ID.
   * @param id The permission ID.
   * @returns The permission.
   * @throws NotFoundException if the permission is not found.
   */
  async findPermissionById(id: string): Promise<Permission | null> {
    const permission = await this.permissionModel.findById(id).exec();
    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found.`);
    }
    return permission;
  }

  /**
   * Updates a permission.
   * @param id The permission ID.
   * @param updateData Data to update.
   * @returns The updated permission.
   * @throws NotFoundException if the permission is not found.
   * @throws BadRequestException if the update fails.
   */
  async updatePermission(
    id: string,
    updateData: Partial<Permission>
  ): Promise<Permission | null> {
    const permission = await this.permissionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found.`);
    }
    return permission;
  }

  /**
   * Deletes a permission.
   * @param id The permission ID.
   * @throws NotFoundException if the permission is not found.
   */
  async deletePermission(id: string): Promise<void> {
    const result = await this.permissionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Permission with ID "${id}" not found.`);
    }
  }
}
