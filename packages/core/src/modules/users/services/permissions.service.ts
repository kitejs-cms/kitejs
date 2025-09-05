import { PermissionResponseModel } from "../models/permission-response.model";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Permission } from "../schemas/permission.schema";
import { CacheService } from "../../cache";
import { CORE_NAMESPACE } from "../../../constants";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);
  private readonly CACHE_KEY = "permissions:list";

  constructor(
    @InjectModel(Permission.name) private permissionModel: Model<Permission>,
    private readonly cache: CacheService
  ) {}

  /**
   * Creates a new permission and invalidates the list cache.
   */
  async createPermission(
    permissionData: Partial<PermissionResponseModel>
  ): Promise<PermissionResponseModel> {
    try {
      // Define a regex pattern that expects a permission name of the form "namespace:resource.action"
      const permissionRegex =
        /^(?<namespace>[a-z0-9][a-z0-9-_]*):(?<resource>[a-z0-9][a-z0-9-_]*)\.(?<action>[a-z0-9][a-z0-9-_]*)$/i;
      const match = permissionData.name.match(permissionRegex);

      console.log("Permission Data:", permissionData);

      if (!match) {
        throw new BadRequestException(
          "Invalid permission name format. Expected format: <namespace>:<resource>.<action>"
        );
      }

      // Check if the namespace in the permission name matches the provided namespace
      if (permissionData.namespace !== match.groups?.namespace) {
        throw new BadRequestException(
          `Permission namespace mismatch. The namespace in the permission name must be "${permissionData.namespace}".`
        );
      }

      const permission = new this.permissionModel(permissionData);
      const savedPermission = await permission.save();

      // Invalidate the list cache
      await this.cache.del(CORE_NAMESPACE, this.CACHE_KEY);

      return {
        id: savedPermission.id,
        name: savedPermission.name,
        description: savedPermission.description,
        namespace: savedPermission.namespace,
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException("Failed to create the permission.");
    }
  }

  /**
   * Retrieves all permissions.
   * Uses cache only if no namespace is provided.
   * @param namespace - (Optional) If provided, skips cache and queries the DB directly.
   */
  async findPermissions(
    namespace?: string
  ): Promise<PermissionResponseModel[]> {
    if (!namespace) {
      // Try to get cached data if namespace is NOT provided
      const cachedPermissions = await this.cache.get<PermissionResponseModel[]>(
        CORE_NAMESPACE,
        this.CACHE_KEY
      );
      if (cachedPermissions) return cachedPermissions;
    }

    // Fetch permissions from DB
    const permissions = await this.permissionModel
      .find(namespace ? { namespace } : {})
      .exec();

    const sanitized = permissions.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      namespace: item.namespace,
    }));

    if (!namespace) {
      // Store in cache only if namespace is NOT set
      await this.cache.set(CORE_NAMESPACE, this.CACHE_KEY, sanitized);
    }

    return sanitized;
  }

  /**
   * Retrieves a permission by ID (No cache).
   */
  async findPermissionById(id: string): Promise<Permission | null> {
    const permission = await this.permissionModel.findById(id).exec();
    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found.`);
    }
    return permission;
  }

  /**
   * Updates a permission and invalidates the list cache.
   */
  async updatePermission(
    id: string,
    updateData: Partial<Permission>
  ): Promise<PermissionResponseModel | null> {
    const permission = await this.permissionModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!permission) {
      throw new NotFoundException(`Permission with ID "${id}" not found.`);
    }

    // Invalidate the list cache
    await this.cache.del(CORE_NAMESPACE, this.CACHE_KEY);

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      namespace: permission.namespace,
    };
  }

  /**
   * Deletes a permission and invalidates the list cache.
   */
  async deletePermission(id: string): Promise<void> {
    const result = await this.permissionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Permission with ID "${id}" not found.`);
    }

    // Invalidate the list cache
    await this.cache.del(CORE_NAMESPACE, this.CACHE_KEY);
  }
}
