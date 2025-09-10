import { UserService } from "../services/users.service";
import { UserResponseDto } from "../dto/user-response.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserStatus } from "../models/user-status.enum";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  ApiPagination,
  createMetaModel,
  parseQuery,
  ValidateObjectIdPipe,
} from "../../../common";
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
  Patch,
  InternalServerErrorException,
  UseGuards,
} from "@nestjs/common";
import { UpdateUserConsentsDto } from "../dto/update-user-consents.dto";
import { UserStatsResponseDto } from "../dto/user-stats-response.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get("stats")
  @ApiOperation({ summary: "Retrieve user registration statistics" })
  @ApiResponse({ status: 200, type: UserStatsResponseDto })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserStats() {
    try {
      const data = await this.userService.getRegistrationStats();
      return new UserStatsResponseDto(data);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve user stats.");
    }
  }

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
  @ApiResponse({
    status: 200,
    description: "List of users",
    type: [UserResponseDto],
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search user by firstName,lastName,email",
    example: "e.g. Mario Rossi",
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiPagination()
  async getAllUsers(@Query() query: Record<string, string>) {
    try {
      const { filter, sort, skip, take } = parseQuery(query);
      const totalItems = await this.userService.countUsers(filter);
      const data = await this.userService.findUsers(skip, take, sort, filter);

      return {
        meta: createMetaModel({ filter, sort, skip, take }, totalItems),
        data: data.map((item) => new UserResponseDto(item)),
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @Patch(":id/consents")
  @ApiOperation({ summary: "Update user consents" })
  @ApiResponse({
    status: 200,
    description: "The user consents have been updated",
    type: UserResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateUserConsents(
    @Param("id") id: string,
    @Body() dto: UpdateUserConsentsDto
  ) {
    try {
      const updatedUser = await this.userService.updateUserConsents(
        id,
        dto.consents
      );
      if (!updatedUser) {
        throw new NotFoundException(`User with ID "${id}" not found.`);
      }
      return new UserResponseDto(updatedUser);
    } catch (error) {
      throw new BadRequestException("Failed to update user consents.");
    }
  }

  @Patch(":id/roles")
  @ApiOperation({ summary: "Assign roles to a user" })
  @ApiResponse({
    status: 200,
    description: "The user roles have been updated",
    type: UserResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async assignRoles(
    @Param("id") id: string,
    @Body("roles") roles: string[]
  ) {
    try {
      const updatedUser = await this.userService.assignRoles(id, roles);
      if (!updatedUser) {
        throw new NotFoundException(`User with ID "${id}" not found.`);
      }
      return new UserResponseDto(updatedUser);
    } catch (error) {
      throw new BadRequestException("Failed to update user roles.");
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a user" })
  @ApiResponse({ status: 200, description: "The user has been deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
