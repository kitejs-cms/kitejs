import { PagesService } from "./services/pages.service";
import { PageResponseDto } from "./dto/page-response.dto";
import { PageResponseDetailDto } from "./dto/page-response-detail.dto";
import { PageStatus } from "./models/page-status.enum";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { JwtPayloadModel } from "../auth/models/payload-jwt.model";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
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
  @ApiBearerAuth()
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

  @Get("web")
  @ApiOperation({
    summary: "Retrieve paginated pages for public web in specific language",
  })
  @ApiResponse({
    status: 200,
    description: "List of pages with selected translations",
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
  async getAllPagesForWeb(
    @Language() language: string,
    @Query() query: Record<string, string>,
    @Query("type") type = "Page"
  ) {
    const { filter, sort, skip, take } = parseQuery(query);

    const totalItems = await this.pagesService.countPages(
      { ...filter, type },
      language
    );

    const data = await this.pagesService.findPagesForWeb(
      skip,
      take,
      sort,
      { ...filter, type },
      language
    );

    return {
      meta: createMetaModel({ filter, sort, skip, take }, totalItems),
      data: data.map((item) => new PageResponseDto(item)),
    };
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAllPages(
    @Language() language: string,
    @Query() query: Record<string, string>,
    @Query("type") type = "Page"
  ) {
    try {
      const { filter, sort, skip, take } = parseQuery(query);

      const totalItems = await this.pagesService.countPages(
        { ...filter, type },
        language
      );

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    @Language() language: string,
    @Param("slug") slug: string,
    @Query("type") type = "Page"
  ) {
    const response = await this.pagesService.findPageForWeb(
      slug,
      language,
      type
    );
    return {
      meta: { query: { type, slug } },
      data: new PageResponseDto(response),
    };
  }
}
