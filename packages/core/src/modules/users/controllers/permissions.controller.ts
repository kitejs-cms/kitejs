import { Controller, Get, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { PermissionsService } from "../services/permissions.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions-guard";
import { Permissions } from "../../../common";

@ApiTags("Permissions")
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: "Retrieve all permissions" })
  @ApiResponse({ status: 200, description: "List of permissions" })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.read")
  @ApiBearerAuth()
  async getPermissions() {
    try {
      return await this.permissionsService.findPermissions();
    } catch {
      throw new BadRequestException("Failed to retrieve permissions.");
    }
  }
}
