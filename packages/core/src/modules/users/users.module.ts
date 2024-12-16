import { Module } from "@nestjs/common";
import { UsersController } from "./controllers/users.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { Role, RoleSchema } from "./schemas/role.schema";
import { Permission, PermissionSchema } from "./schemas/permission.schema";
import { UserService } from "./services/users.service";
import { RoleService } from "./services/role.service";
import { PermissionService } from "./services/permission.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UserService, RoleService, PermissionService],
  exports: [UserService, RoleService, PermissionService],
})
export class UsersModule {}
