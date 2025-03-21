import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { PaginationModel, ValidateObjectIdPipe } from "../../../common";
import { UserService } from "../services/users.service";
import { UserResponseDto } from "../dto/user-response.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserStatus } from "../models/user-status.enum";
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  NotFoundException,
  BadRequestException,
  HttpCode,
  ParseIntPipe,
  Patch,
  InternalServerErrorException,
} from "@nestjs/common";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: "Retrieve all users" })
  @ApiResponse({
    status: 200,
    description: "Total number of users",
    type: Number,
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    enum: UserStatus,
    description: "Filter users by status. Optional parameter.",
  })
  @ApiQuery({ name: "page", required: true, type: Number })
  @ApiQuery({ name: "itemsPerPage", required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: "List of users",
    type: [UserResponseDto],
  })
  async getAllUsers(
    @Query("page", ParseIntPipe) page: number,
    @Query("itemsPerPage", ParseIntPipe) itemsPerPage: number,
    @Query("status") status?: UserStatus
  ) {
    try {
      const totalItems = await this.userService.countUsers(status);
      const data = await this.userService.findUsers(page, itemsPerPage, status);

      const pagination: PaginationModel = {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / itemsPerPage),
        pageSize: itemsPerPage,
      };

      return {
        data: data.map((item) => new UserResponseDto(item)),
        meta: { pagination, query: { status } },
      };
    } catch (error) {
      throw new BadRequestException("Failed to retrieve users.");
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve a user by ID" })
  @ApiResponse({
    status: 200,
    description: "The user data",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async getUserById(@Param("id", ValidateObjectIdPipe) id: string) {
    try {
      const data = await this.userService.findUser(id);

      if (!data) throw new NotFoundException(`User with ID "${id}" not found.`);

      return new UserResponseDto(data);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve the user.");
    }
  }

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({
    status: 201,
    description: "The user has been created",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid data" })
  @HttpCode(201)
  async createUser(@Body() createUserDto: CreateUserDto) {
    try {
      const newUser = await this.userService.createUser(createUserDto);
      if (!newUser) throw new InternalServerErrorException();

      return new UserResponseDto(newUser);
    } catch (error) {
      throw new BadRequestException("Failed to create the user.");
    }
  }

  @Patch(":id")
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
    try {
      const updatedUser = await this.userService.updateUser(id, updateUserDto);
      if (!updatedUser) {
        throw new NotFoundException(`User with ID "${id}" not found.`);
      }
      return new UserResponseDto(updatedUser);
    } catch (error) {
      throw new BadRequestException("Failed to update the user.");
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a user" })
  @ApiResponse({ status: 200, description: "The user has been deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  @HttpCode(200)
  async deleteUser(@Param("id") id: string) {
    try {
      const result = await this.userService.deleteUser(id);
      if (!result) {
        throw new NotFoundException(`User with ID "${id}" not found.`);
      }
      return { message: `User with ID "${id}" has been deleted.` };
    } catch (error) {
      throw new BadRequestException("Failed to delete the user.");
    }
  }
}
