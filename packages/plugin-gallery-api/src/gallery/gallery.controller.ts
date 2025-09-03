import type { JwtPayloadModel } from "@kitejs-cms/core";
import { GalleryService } from "./services/gallery.service";
import { GalleryResponseDto } from "./dto/gallery-response.dto";
import { GalleryUpsertDto } from "./dto/gallery-upsert.dto";
import { GalleryItemDto } from "./dto/gallery-item.dto";
import { GallerySortDto } from "./dto/gallery-sort.dto";
import { GalleryStatus } from "./models/gallery-status.enum";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from "@nestjs/swagger";
import {
  JwtAuthGuard,
  GetAuthUser,
  Language,
  ValidateObjectIdPipe,
  ApiPagination,
  ApiSort,
  createMetaModel,
  parseQuery,
} from "@kitejs-cms/core";

@ApiTags("Gallery")
@Controller("galleries")
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Upsert gallery" })
  @ApiResponse({ status: 201, description: "Gallery created" })
  async upsertGallery(
    @Body() dto: GalleryUpsertDto,
    @GetAuthUser() user: JwtPayloadModel
  ) {
    const gallery = await this.galleryService.upsertGallery(dto, user);
    return new GalleryResponseDto(gallery);
  }

  @Get("web")
  @ApiOperation({
    summary: "Retrieve paginated galleries for public web in specific language",
  })
  @ApiResponse({
    status: 200,
    description: "List of galleries",
    type: [GalleryResponseDto],
  })
  @ApiPagination()
  @ApiSort(["createdAt", "updatedAt", "publishAt"])
  @ApiQuery({
    name: "status",
    required: false,
    enum: GalleryStatus,
    description: "Filter galleries by status",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search in gallery titles and descriptions",
  })
  async getAllGalleriesForWeb(
    @Language() language: string,
    @Query() query: Record<string, string>
  ) {
    const { filter, sort, skip, take } = parseQuery(query);
    const typedFilter = filter as { status?: GalleryStatus; search?: string };
    const totalItems = await this.galleryService.countGalleries(
      typedFilter,
      language
    );
    const data = await this.galleryService.findGalleriesForWeb(
      skip,
      take,
      sort,
      typedFilter,
      language
    );
    return {
      meta: createMetaModel({ filter, sort, skip, take }, totalItems),
      data: data.map((item) => new GalleryResponseDto(item)),
    };
  }

  @Get("web/:slug/items")
  @ApiOperation({
    summary: "Retrieve paginated items of a gallery (public web)",
  })
  @ApiResponse({
    status: 200,
    description: "List of items",
    type: [GalleryItemDto],
  })
  @ApiPagination()
  @ApiSort(["position", "createdAt"])
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search in item titles/captions/alt/tags",
  })
  @ApiQuery({
    name: "tags",
    required: false,
    type: String,
    description: "Comma-separated tags filter",
  })
  async getGalleryItemsForWeb(
    @Language() language: string,
    @Param("slug") slug: string,
    @Query() query: Record<string, string>
  ) {
    const gallery = await this.galleryService.findGalleryForWeb(slug, language);
    if (!gallery) throw new NotFoundException("Gallery not found");

    const { filter, sort, skip, take } = parseQuery(query);
    const typedFilter = {
      ...filter,
      // es: normalizza tags=tag1,tag2 -> ["tag1","tag2"]
      tags:
        typeof filter.tags === "string" ? filter.tags.split(",") : undefined,
    } as { search?: string; tags?: string[] };

    const totalItems = await this.galleryService.countGalleryItemsForWeb(
      gallery.id,
      typedFilter
    );

    const items = await this.galleryService.findGalleryItemsForWeb(
      gallery.id,
      skip,
      take,
      sort, // es: { position: "asc" } o { createdAt: "desc" }
      typedFilter // es: { search, tags }
    );

    return {
      meta: createMetaModel({ filter, sort, skip, take }, totalItems),
      data: items.map((i) => new GalleryItemDto(i)),
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Retrieve all galleries" })
  @ApiResponse({
    status: 200,
    description: "List of galleries",
    type: [GalleryResponseDto],
  })
  @ApiPagination()
  @ApiSort(["createdAt", "updatedAt", "publishAt"])
  @ApiQuery({
    name: "status",
    required: false,
    enum: GalleryStatus,
    description: "Filter galleries by status",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search in gallery titles and descriptions",
  })
  async getAllGalleries(
    @Language() language: string,
    @Query() query: Record<string, string>
  ) {
    const { filter, sort, skip, take } = parseQuery(query);
    const typedFilter = filter as { status?: GalleryStatus; search?: string };
    const totalItems = await this.galleryService.countGalleries(
      typedFilter,
      language
    );
    const data = await this.galleryService.findGalleries(
      skip,
      take,
      sort,
      typedFilter,
      language
    );
    return {
      meta: createMetaModel({ filter, sort, skip, take }, totalItems),
      data: data.map((item) => new GalleryResponseDto(item)),
    };
  }

  @Get("web/:slug")
  @ApiOperation({ summary: "Get gallery by slug for web" })
  @ApiResponse({ status: 200, description: "Gallery response" })
  async getGalleryForWeb(
    @Language() language: string,
    @Param("slug") slug: string
  ) {
    const gallery = await this.galleryService.findGalleryForWeb(slug, language);
    return new GalleryResponseDto(gallery);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get gallery by id" })
  async getGallery(@Param("id") id: string) {
    const gallery = await this.galleryService.findGalleryById(id);
    return new GalleryResponseDto(gallery);
  }

  @Post(":id/items/upload")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    required: true,
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiOperation({ summary: "Upload item image" })
  async uploadItem(
    @Param("id", ValidateObjectIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    return this.galleryService.uploadItemFile(id, file);
  }

  @Post(":id/items")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Add item to gallery" })
  async addItem(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body() dto: GalleryItemDto,
    @GetAuthUser() user: JwtPayloadModel
  ) {
    const gallery = await this.galleryService.addItem(id, dto, user);
    return new GalleryResponseDto(gallery);
  }

  @Delete(":id/items/:itemId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove item from gallery" })
  async removeItem(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Param("itemId", ValidateObjectIdPipe) itemId: string,
    @GetAuthUser() user: JwtPayloadModel
  ) {
    const gallery = await this.galleryService.removeItem(id, itemId, user);
    return new GalleryResponseDto(gallery);
  }

  @Post(":id/items/sort")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Sort gallery items" })
  async sortItems(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body() dto: GallerySortDto,
    @GetAuthUser() user: JwtPayloadModel
  ) {
    const gallery = await this.galleryService.sortItems(id, dto.itemIds, user);
    return new GalleryResponseDto(gallery);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: "Delete gallery" })
  async deleteGallery(@Param("id", ValidateObjectIdPipe) id: string) {
    const result = await this.galleryService.deleteGallery(id);
    if (!result) {
      throw new NotFoundException(`Gallery with ID "${id}" not found.`);
    }
    return { message: `Gallery with ID "${id}" has been deleted.` };
  }
}
