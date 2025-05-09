import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { PostResponseDto } from "./dto/post-response.dto";
import { PostUpsertDto } from "./dto/post-upsert.dto";
import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  HttpCode,
  ParseIntPipe,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";
import { PostsService } from "./posts.service";
import { PostStatus } from "./models/post-status.enum";
import {
  GetAuthUser,
  JwtAuthGuard,
  JwtPayloadModel,
  PaginationModel,
  ValidateObjectIdPipe,
} from "@kitejs-cms/core/index";
import { PostResponseDetailDto } from "./dto/page-response-detail.dto";

@ApiTags("Posts")
@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: "Upsert post" })
  @ApiResponse({
    status: 201,
    description: "The post has been successfully created",
    type: PostResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async upsertPost(
    @Body() upsertPostDto: PostUpsertDto,
    @GetAuthUser() user: JwtPayloadModel
  ): Promise<PostResponseDetailDto> {
    const post = await this.postsService.upsertPost(upsertPostDto, user);
    return new PostResponseDetailDto(post);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all posts" })
  @ApiResponse({
    status: 200,
    description: "Total number of posts",
    type: Number,
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    enum: PostStatus,
    description: "Filter posts by status. Optional parameter.",
  })
  @ApiQuery({ name: "page", required: true, type: Number })
  @ApiQuery({ name: "itemsPerPage", required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: "List of posts",
    type: [PostResponseDto],
  })
  async getAllPosts(
    @Query("page", ParseIntPipe) page: number,
    @Query("itemsPerPage", ParseIntPipe) itemsPerPage: number,
    @Query("status") status?: PostStatus
  ) {
    try {
      const totalItems = await this.postsService.countPosts();
      const data = await this.postsService.findPosts(page, itemsPerPage);

      const pagination: PaginationModel = {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / itemsPerPage),
        pageSize: itemsPerPage,
      };

      return {
        meta: { pagination, query: { status } },
        data: data.map((item) => new PostResponseDetailDto(item)),
      };
    } catch (error) {
      throw new BadRequestException("Failed to retrieve posts.");
    }
  }

  @Get(":id")
  @ApiOperation({
    summary: "Retrieve post for admin backoffice",
  })
  @ApiResponse({
    status: 200,
    description: "Post response",
    type: PostResponseDetailDto,
  })
  @ApiResponse({ status: 404, description: "Post or translation not found" })
  async getPost(@Param("id") id: string) {
    try {
      const response = await this.postsService.findPostById(id);
      return new PostResponseDetailDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve post.");
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a post" })
  @ApiResponse({ status: 200, description: "The post has been deleted" })
  @ApiResponse({ status: 404, description: "Post not found" })
  @HttpCode(200)
  async deletePost(@Param("id", ValidateObjectIdPipe) id: string) {
    try {
      const result = await this.postsService.deletePost(id);
      if (!result) {
        throw new NotFoundException(`Post with ID "${id}" not found.`);
      }
      return { message: `Post with ID "${id}" has been deleted.` };
    } catch (error) {
      throw new BadRequestException("Failed to delete the post.");
    }
  }

  @Get("web/:slug")
  @ApiOperation({
    summary: "Retrieve post for public web in specific language",
  })
  @ApiQuery({
    name: "lang",
    required: true,
    description: "Language code to get the correct translation (e.g. en, it)",
    type: String,
  })
  @ApiQuery({
    name: "fallback",
    required: false,
    description:
      "Optional fallback language code if requested translation is missing",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Post response with selected translation",
    type: PostResponseDto,
  })
  @ApiResponse({ status: 404, description: "Post or translation not found" })
  async getPostForWeb(
    @Param("slug") slug: string,
    @Query("lang") language: string,
    @Query("fallback") fallbackLanguage?: string
  ) {
    try {
      const response = await this.postsService.findPostForWeb(
        slug,
        language,
        fallbackLanguage
      );
      return new PostResponseDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve post for web.");
    }
  }
}
