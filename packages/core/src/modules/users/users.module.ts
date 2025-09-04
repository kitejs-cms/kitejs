import { Module } from "@nestjs/common";
import { UsersController } from "./controllers/users.controller";
import { RolesController } from "./controllers/roles.controller";
import { PermissionsController } from "./controllers/permissions.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { Role, RoleSchema } from "./schemas/role.schema";
import { Permission, PermissionSchema } from "./schemas/permission.schema";
import { UserService } from "./services/users.service";
import { RolesService } from "./services/roles.service";
import { PermissionsService } from "./services/permissions.service";
import { CacheModule } from "../cache/cache.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
    CacheModule,
  ],
  controllers: [UsersController, RolesController, PermissionsController],
  providers: [UserService, RolesService, PermissionsService],
  exports: [UserService, RolesService, PermissionsService],
})
export class UsersModule {}
