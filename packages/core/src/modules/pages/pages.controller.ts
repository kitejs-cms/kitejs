import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { PagesService } from "./services/pages.service";
import { PageResponseDto } from "./dto/page-response.dto";
import { PageResponseDetailDto } from "./dto/page-response-detail.dto";
import { PageStatus } from "./models/page-status.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayloadModel } from "../auth/models/payload-jwt.model";
import {
  ApiPagination,
  ApiSort,
  createMetaModel,
  GetAuthUser,
  Language,
  parseQuery,
  ValidateObjectIdPipe,
} from "../../common";
import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  HttpCode,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common";

@ApiTags("Pages")
@Controller("pages")
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: "Upsert page" })
  @ApiResponse({
    status: 201,
    description: "The page has been successfully created",
    type: PageResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async upsertPage(
    @Body() upsertPageDto,
    @GetAuthUser() user: JwtPayloadModel
  ): Promise<PageResponseDetailDto> {
    const page = await this.pagesService.upsertPage(upsertPageDto, user);
    return new PageResponseDetailDto(page);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all pages" })
  @ApiResponse({
    status: 200,
    description: "List of pages",
    type: [PageResponseDto],
  })
  @ApiPagination()
  @ApiSort(["createdAt", "updatedAt", "publishAt"])
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    enum: PageStatus,
    description: "Filter pages by status",
  })
  @ApiQuery({
    name: "type",
    required: false,
    type: String,
    description: "Filter pages by type",
    example: "Page",
  })
  @ApiQuery({
    name: "category",
    required: false,
    type: String,
    description: "Filter pages by category slug or id",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search in page titles and descriptions",
    example: "javascript tutorial",
  })
  async getAllPages(
    @Language() language: string,
    @Query() query: Record<string, string>,
    @Query("type") type = "Page"
  ) {
    try {
      const { filter, sort, skip, take } = parseQuery(query);

      const totalItems = await this.pagesService.countPages({
        ...filter,
        type,
      });
      const data = await this.pagesService.findPages(
        skip,
        take,
        sort,
        { ...filter, type },
        language
      );

      return {
        meta: createMetaModel({ filter, sort, skip, take }, totalItems),
        data: data.map((item) => new PageResponseDetailDto(item)),
      };
    } catch (error) {
      throw new BadRequestException("Failed to retrieve pages.");
    }
  }

  @Get(":id")
  @ApiOperation({
    summary: "Retrieve page for admin backoffice",
  })
  @ApiResponse({
    status: 200,
    description: "Page response",
    type: PageResponseDetailDto,
  })
  @ApiResponse({ status: 404, description: "Page or translation not found" })
  async getPage(@Param("id") id: string) {
    try {
      const response = await this.pagesService.findPageById(id);
      return new PageResponseDetailDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve page.");
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a page" })
  @ApiResponse({ status: 200, description: "The page has been deleted" })
  @ApiResponse({ status: 404, description: "Page not found" })
  @HttpCode(200)
  async deletePage(@Param("id", ValidateObjectIdPipe) id: string) {
    try {
      const result = await this.pagesService.deletePage(id);
      if (!result) {
        throw new NotFoundException(`Page with ID "${id}" not found.`);
      }
      return { message: `Page with ID "${id}" has been deleted.` };
    } catch (error) {
      throw new BadRequestException("Failed to delete the page.");
    }
  }

  @Get("web/:slug")
  @ApiOperation({
    summary: "Retrieve page for public web in specific language",
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
    description: "Page response with selected translation",
    type: PageResponseDto,
  })
  @ApiQuery({
    name: "type",
    required: false,
    type: String,
    description: "Filter pages by type. Optional parameter.",
  })
  @ApiResponse({ status: 404, description: "Page or translation not found" })
  async getPageForWeb(
    @Param("slug") slug: string,
    @Query("lang") language: string,
    @Query("fallback") fallbackLanguage?: string,
    @Query("type") type = "Page"
  ) {
    try {
      const response = await this.pagesService.findPageForWeb(
        slug,
        language,
        type,
        fallbackLanguage
      );
      return {
        meta: { query: { lang: language, type, slug, fallbackLanguage } },
        data: new PageResponseDto(response),
      };
    } catch (error) {
      throw new BadRequestException("Failed to retrieve page for web.");
    }
  }
}
