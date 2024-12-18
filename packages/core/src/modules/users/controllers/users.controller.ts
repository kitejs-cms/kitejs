import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { UserService } from "../services/users.service";
import { UserResponseDto } from "../dto/user-response.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserStatus } from "../models/user-status.enum";
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from "@nestjs/common";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: "Retrieve all users" })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    enum: UserStatus,
    description: "Filter users by status. Optional parameter.",
  })
  @ApiResponse({
    status: 200,
    description: "List of users",
    type: [UserResponseDto],
  })
  async getAllUsers(@Query("status") status?: UserStatus) {
    console.log("test");
    return await this.userService.findUsers(status);
  }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve a user by ID" })
  @ApiResponse({
    status: 200,
    description: "The user data",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserById(@Param("id") id: string) {
    return this.userService.findUserById(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({
    status: 201,
    description: "The user has been created",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid data" })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an existing user" })
  @ApiResponse({
    status: 200,
    description: "The user has been updated",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 400, description: "Invalid data" })
  async updateUser(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a user" })
  @ApiResponse({ status: 200, description: "The user has been deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  async deleteUser(@Param("id") id: string) {
    return this.userService.deleteUser(id);
  }
}
