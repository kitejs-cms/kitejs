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
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions-guard";
import { Permissions, ValidateObjectIdPipe } from "../../../common";

@ApiTags("Roles")
@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: "Retrieve all roles" })
  @ApiResponse({ status: 200, description: "List of roles" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.read")
    @ApiBearerAuth()
    async getRoles() {
      try {
        return await this.rolesService.findRoles();
      } catch {
        throw new BadRequestException("Failed to retrieve roles.");
      }
    }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve a role by ID" })
  @ApiResponse({ status: 200, description: "The role data" })
  @ApiResponse({ status: 404, description: "Role not found" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.read")
  @ApiBearerAuth()
  async getRole(@Param("id", ValidateObjectIdPipe) id: string) {
    try {
      const role = await this.rolesService.findRoleById(id);
      if (!role) {
        throw new NotFoundException(`Role with ID "${id}" not found.`);
      }
      return role;
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
    async createRole(@Body() body: any) {
      try {
        return await this.rolesService.createRole(body);
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
  ) {
    try {
      return await this.rolesService.updateRole(id, body);
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
  ) {
    try {
      return await this.rolesService.assignPermissions(id, permissions);
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
  ) {
    try {
      return await this.rolesService.removePermissions(id, permissions);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException("Failed to remove permissions.");
    }
  }
}

