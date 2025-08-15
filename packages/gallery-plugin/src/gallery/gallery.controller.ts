import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard, GetAuthUser, Language, ValidateObjectIdPipe } from "@kitejs-cms/core";
import type { JwtPayloadModel } from "@kitejs-cms/core";
import { GalleryService } from "./services/gallery.service";
import { GalleryResponseDto } from "./dto/gallery-response.dto";
import { GalleryUpsertDto } from "./dto/gallery-upsert.dto";
import { GalleryItemDto } from "./dto/gallery-item.dto";
import { GallerySortDto } from "./dto/gallery-sort.dto";

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

  @Get("web/:slug")
  @ApiOperation({ summary: "Get gallery by slug for web" })
  @ApiResponse({ status: 200, description: "Gallery response" })
  async getGalleryForWeb(
    @Language() language: string,
    @Param("slug") slug: string
  ) {
    const gallery = await this.galleryService.findGalleryForWeb(
      slug,
      language
    );
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

