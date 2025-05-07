import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";
import { JwtAuthGuard } from "@kitejs-cms/core/modules/auth/guards/jwt-auth.guard";
import { CategoryResponseDto } from "./dto/category-response.dto";
import { CategoryUpsertDto } from "./dto/category-upsert.dto";
import { JwtPayloadModel } from "@kitejs-cms/core/modules/auth/models/payload-jwt.model";
import { CategoryResponseDetailDto } from "./dto/category-response-detail.dto";
import {
  GetAuthUser,
  PaginationModel,
  ValidateObjectIdPipe,
} from "@kitejs-cms/core/index";
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

@ApiTags("Categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: "Upsert category" })
  @ApiResponse({
    status: 201,
    description: "The category has been successfully created",
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async upsertCategory(
    @Body() upsertCategoryDto: CategoryUpsertDto,
    @GetAuthUser() user: JwtPayloadModel
  ): Promise<CategoryResponseDetailDto> {
    const category = await this.categoriesService.upsertCategory(
      upsertCategoryDto,
      user
    );
    return new CategoryResponseDetailDto(category);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all categories" })
  @ApiResponse({
    status: 200,
    description: "Total number of categories",
    type: Number,
  })
  @ApiQuery({ name: "category", required: true, type: Number })
  @ApiQuery({ name: "itemsPerCategory", required: true, type: Number })
  @ApiResponse({
    status: 200,
    description: "List of categories",
    type: [CategoryResponseDto],
  })
  async getAllCategories(
    @Query("page", ParseIntPipe) page: number,
    @Query("itemsPerCategory", ParseIntPipe) itemsPerCategory: number
  ) {
    try {
      const totalItems = await this.categoriesService.countCategories();
      const data = await this.categoriesService.findCategories(
        page,
        itemsPerCategory
      );

      const pagination: PaginationModel = {
        totalItems,
        currentPage: page,
        totalPages: Math.ceil(totalItems / itemsPerCategory),
        pageSize: itemsPerCategory,
      };

      return {
        meta: { pagination },
        data: data.map((item) => new CategoryResponseDetailDto(item)),
      };
    } catch (error) {
      throw new BadRequestException("Failed to retrieve categories.");
    }
  }
  @Get(":id")
  @ApiOperation({
    summary: "Retrieve category for admin backoffice",
  })
  @ApiResponse({
    status: 200,
    description: "Category response",
    type: CategoryResponseDetailDto,
  })
  @ApiResponse({
    status: 404,
    description: "Category or translation not found",
  })
  async getCategory(@Param("id") id: string) {
    try {
      const response = await this.categoriesService.findCategoryById(id);
      return new CategoryResponseDetailDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve category.");
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a category" })
  @ApiResponse({ status: 200, description: "The category has been deleted" })
  @ApiResponse({ status: 404, description: "Category not found" })
  @HttpCode(200)
  async deleteCategory(@Param("id", ValidateObjectIdPipe) id: string) {
    try {
      const result = await this.categoriesService.deleteCategory(id);
      if (!result) {
        throw new NotFoundException(`Category with ID "${id}" not found.`);
      }
      return { message: `Category with ID "${id}" has been deleted.` };
    } catch (error) {
      throw new BadRequestException("Failed to delete the category.");
    }
  }

  @Get("web/:slug")
  @ApiOperation({
    summary: "Retrieve category for public web in specific language",
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
    description: "Category response with selected translation",
    type: CategoryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Category or translation not found",
  })
  async getCategoryForWeb(
    @Param("slug") slug: string,
    @Query("lang") language: string,
    @Query("fallback") fallbackLanguage?: string
  ) {
    try {
      const response = await this.categoriesService.findCategoryForWeb(
        slug,
        language,
        fallbackLanguage
      );
      return new CategoryResponseDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve category for web.");
    }
  }
}
