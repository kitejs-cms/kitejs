import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { RolesService } from "../services/roles.service";
import { RoleResponseDto } from "../dto/role-response.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions-guard";
import { Permissions, ValidateObjectIdPipe } from "../../../common";

@ApiTags("Roles")
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: "Retrieve all roles" })
  @ApiResponse({
    status: 200,
    description: "List of roles",
    type: [RoleResponseDto],
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.read")
    @ApiBearerAuth()
    async getRoles(): Promise<RoleResponseDto[]> {
      try {
        const roles = await this.rolesService.findRoles();
        return roles.map((r) => new RoleResponseDto(r));
      } catch {
        throw new BadRequestException("Failed to retrieve roles.");
      }
    }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve a role by ID" })
  @ApiResponse({
    status: 200,
    description: "The role data",
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: "Role not found" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.read")
  @ApiBearerAuth()
  async getRole(
    @Param("id", ValidateObjectIdPipe) id: string
  ): Promise<RoleResponseDto> {
    try {
      const role = await this.rolesService.findRoleById(id);
      if (!role) {
        throw new NotFoundException(`Role with ID "${id}" not found.`);
      }
      return new RoleResponseDto(role);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException("Failed to retrieve the role.");
    }
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: "Create a new role" })
  @ApiResponse({ status: 201, description: "The role has been created" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.create")
    @ApiBearerAuth()
    async createRole(@Body() body: any): Promise<RoleResponseDto | null> {
      try {
        const role = await this.rolesService.createRole(body);
        return role ? new RoleResponseDto(role) : null;
      } catch {
        throw new BadRequestException("Failed to create the role.");
      }
    }

  @Patch(":id")
  @ApiOperation({ summary: "Update an existing role" })
  @ApiResponse({ status: 200, description: "The role has been updated" })
  @ApiResponse({ status: 404, description: "Role not found" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.update")
  @ApiBearerAuth()
  async updateRole(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body() body: any
  ): Promise<RoleResponseDto | null> {
    try {
      const role = await this.rolesService.updateRole(id, body);
      return role ? new RoleResponseDto(role) : null;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException("Failed to update the role.");
    }
  }

  @Delete(":id")
  @HttpCode(200)
  @ApiOperation({ summary: "Delete a role" })
  @ApiResponse({ status: 200, description: "The role has been deleted" })
  @ApiResponse({ status: 404, description: "Role not found" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.delete")
  @ApiBearerAuth()
  async deleteRole(@Param("id", ValidateObjectIdPipe) id: string) {
    try {
      await this.rolesService.deleteRole(id);
      return { message: `Role with ID "${id}" has been deleted.` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException("Failed to delete the role.");
    }
  }

  @Post(":id/permissions")
  @ApiOperation({ summary: "Assign permissions to a role" })
  @ApiResponse({ status: 200, description: "Permissions assigned" })
  @ApiResponse({ status: 404, description: "Role not found" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.update")
  @ApiBearerAuth()
  async assignPermissions(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body("permissions") permissions: string[]
  ): Promise<RoleResponseDto | null> {
    try {
      const role = await this.rolesService.assignPermissions(id, permissions);
      return role ? new RoleResponseDto(role) : null;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException("Failed to assign permissions.");
    }
  }

  @Delete(":id/permissions")
  @ApiOperation({ summary: "Remove permissions from a role" })
  @ApiResponse({ status: 200, description: "Permissions removed" })
  @ApiResponse({ status: 404, description: "Role not found" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.update")
  @ApiBearerAuth()
  async removePermissions(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body("permissions") permissions: string[]
  ): Promise<RoleResponseDto | null> {
    try {
      const role = await this.rolesService.removePermissions(id, permissions);
      return role ? new RoleResponseDto(role) : null;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException("Failed to remove permissions.");
    }
  }
}

