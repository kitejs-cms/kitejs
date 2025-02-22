import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Role } from '../schemas/role.schema';
import { CacheService } from '../../cache';
import { CORE_NAMESPACE } from '../../../constants';
import { Permission } from '../schemas/permission.schema';
import { RoleResponseModel } from '../models/role-response.model';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);
  private readonly CACHE_KEY = 'roles:list';

  constructor(
    @InjectModel(Role.name) private roleModel: Model<Role>,
    private readonly cache: CacheService
  ) {}

  /**
   * Creates a new role and invalidates the list cache.
   */
  async createRole(roleData: Partial<Role>): Promise<RoleResponseModel | null> {
    try {
      const role = new this.roleModel(roleData);
      const savedRole = await role.save();

      // Invalidate the list cache
      await this.cache.del(CORE_NAMESPACE, this.CACHE_KEY);

      return this.findRoleById(savedRole.id);
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Failed to create the role.');
    }
  }

  /**
   * Retrieves all roles.
   * Uses cache only if no namespace is provided.
   * @param namespace - (Optional) If provided, skips cache and queries the DB directly.
   */
  async findRoles(namespace?: string): Promise<RoleResponseModel[]> {
    if (!namespace) {
      const cachedRoles = await this.cache.get<RoleResponseModel[]>(
        CORE_NAMESPACE,
        this.CACHE_KEY
      );

      if (cachedRoles) return cachedRoles;
    }

    const rolesFromDb = await this.roleModel
      .find()
      .populate<{ permissions: Permission[] }>('permissions')
      .exec();

    const processedRoles = rolesFromDb.map((role) => ({
      ...role.toJSON(),
      permissions: role.permissions.map((permission) => permission.name),
    }));

    if (!namespace) {
      await this.cache.set(CORE_NAMESPACE, this.CACHE_KEY, processedRoles);
    }

    return processedRoles as RoleResponseModel[];
  }

  async findRoleById(id: string): Promise<RoleResponseModel | null> {
    const role = await this.roleModel
      .findById(id)
      .populate<{ permissions: Permission[] }>('permissions')
      .exec();

    if (!role) return null;

    return {
      ...role.toJSON(),
      permissions: role.permissions.map((item) => item.name),
    } as RoleResponseModel;
  }

  /**
   * Updates a role and invalidates the list cache.
   */
  async updateRole(
    id: string,
    updateData: Partial<Role>
  ): Promise<RoleResponseModel | null> {
    const role = await this.roleModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }

    await this.cache.del(CORE_NAMESPACE, this.CACHE_KEY);

    return this.findRoleById(id);
  }

  /**
   * Deletes a role and invalidates the list cache.
   */
  async deleteRole(id: string): Promise<void> {
    const result = await this.roleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Role with ID "${id}" not found.`);
    }

    // Invalidate the list cache
    await this.cache.del(CORE_NAMESPACE, this.CACHE_KEY);
  }

  /**
   * Assigns permissions to a role and invalidates the list cache.
   */
  async assignPermissions(
    roleId: string,
    permissions: string[]
  ): Promise<RoleResponseModel | null> {
    const role = await this.roleModel
      .findByIdAndUpdate(
        roleId,
        { $addToSet: { permissions: { $each: permissions } } },
        { new: true }
      )
      .populate('permissions')
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found.`);
    }

    // Invalidate the list cache
    await this.cache.del(CORE_NAMESPACE, this.CACHE_KEY);

    return this.findRoleById(roleId);
  }

  /**
   * Removes permissions from a role and invalidates the list cache.
   */
  async removePermissions(
    roleId: string,
    permissions: string[]
  ): Promise<RoleResponseModel | null> {
    const role = await this.roleModel
      .findByIdAndUpdate(
        roleId,
        { $pull: { permissions: { $in: permissions } } },
        { new: true }
      )
      .populate('permissions')
      .exec();

    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found.`);
    }

    // Invalidate the list cache
    await this.cache.del(CORE_NAMESPACE, this.CACHE_KEY);

    return this.findRoleById(roleId);
  }
}
