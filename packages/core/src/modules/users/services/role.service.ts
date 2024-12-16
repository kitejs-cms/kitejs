import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Role } from "../schemas/role.schema";

@Injectable()
export class RoleService {
  constructor(@InjectModel(Role.name) private roleModel: Model<Role>) {}

  /**
   * Creates a new role.
   * @param roleData Data for the new role.
   * @returns The created role.
   * @throws BadRequestException if the role cannot be created.
   */
  async createRole(roleData: Partial<Role>): Promise<Role> {
    try {
      const role = new this.roleModel(roleData);
      return await role.save();
    } catch (error) {
      throw new BadRequestException("Failed to create the role.");
    }
  }

  /**
   * Retrieves all roles.
   * @returns An array of roles.
   */
  async findRoles(): Promise<Role[]> {
    return await this.roleModel.find().populate("permissions").exec();
  }

  /**
   * Retrieves a role by ID.
   * @param id The role ID.
   * @returns The role.
   * @throws NotFoundException if the role is not found.
   */
  async findRoleById(id: string): Promise<Role | null> {
    const role = await this.roleModel
      .findById(id)
      .populate("permissions")
      .exec();
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return role;
  }

  /**
   * Updates a role.
   * @param id The role ID.
   * @param updateData Data to update.
   * @returns The updated role.
   * @throws NotFoundException if the role is not found.
   * @throws BadRequestException if the update fails.
   */
  async updateRole(
    id: string,
    updateData: Partial<Role>
  ): Promise<Role | null> {
    const role = await this.roleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
    return role;
  }

  /**
   * Deletes a role.
   * @param id The role ID.
   * @throws NotFoundException if the role is not found.
   */
  async deleteRole(id: string): Promise<void> {
    const result = await this.roleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }
  }

  /**
   * Assigns permissions to a role.
   * @param roleId The role ID.
   * @param permissions Array of permission IDs to assign.
   * @returns The updated role.
   * @throws NotFoundException if the role is not found.
   */
  async assignPermissions(
    roleId: string,
    permissions: string[]
  ): Promise<Role | null> {
    const role = await this.roleModel
      .findByIdAndUpdate(
        roleId,
        { $addToSet: { permissions: { $each: permissions } } }, // Add permissions without duplicates
        { new: true }
      )
      .populate("permissions")
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found.`);
    }
    return role;
  }

  /**
   * Removes permissions from a role.
   * @param roleId The role ID.
   * @param permissions Array of permission IDs to remove.
   * @returns The updated role.
   * @throws NotFoundException if the role is not found.
   */
  async removePermissions(
    roleId: string,
    permissions: string[]
  ): Promise<Role | null> {
    const role = await this.roleModel
      .findByIdAndUpdate(
        roleId,
        { $pull: { permissions: { $in: permissions } } }, // Remove specific permissions
        { new: true }
      )
      .populate("permissions")
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found.`);
    }
    return role;
  }
}
