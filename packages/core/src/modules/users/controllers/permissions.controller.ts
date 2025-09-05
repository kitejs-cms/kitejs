import { Controller, Get, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { PermissionsService } from "../services/permissions.service";
import { PermissionResponseDto } from "../dto/permission-response.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions-guard";
import { Permissions } from "../../../common";

@ApiTags("Permissions")
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: "Retrieve all permissions" })
  @ApiResponse({
    status: 200,
    description: "List of permissions",
    type: [PermissionResponseDto],
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions("core:roles.read")
  @ApiBearerAuth()
  async getPermissions(): Promise<PermissionResponseDto[]> {
    try {
      const permissions = await this.permissionsService.findPermissions();
      return permissions.map((p) => new PermissionResponseDto(p));
    } catch {
      throw new BadRequestException("Failed to retrieve permissions.");
    }
  }
}
