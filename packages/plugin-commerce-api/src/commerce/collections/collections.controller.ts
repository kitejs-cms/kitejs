import type { JwtPayloadModel } from "@kitejs-cms/core";
import { CollectionsService } from "./collections.service";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  GetAuthUser,
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
  ValidateObjectIdPipe,
  ApiPagination,
  ApiSort,
  Language,
  parseQuery,
  createMetaModel,
} from "@kitejs-cms/core";

import { CollectionResponseDto } from "./dto/collection-response.dto";
import { CollectionUpsertDto } from "./dto/upsert-collection.dto";
import { CollectionResponseDetailsDto } from "./dto/collection-response-details.dto";
@ApiTags("Commerce - Collections")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("commerce/collections")
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: "Upsert collection" })
  @ApiResponse({
    status: 201,
    description: "The collection has been successfully created",
    type: CollectionResponseDto,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async upsertCollection(
    @Body() upsertCollectionDto: CollectionUpsertDto,
    @GetAuthUser() user: JwtPayloadModel
  ): Promise<CollectionResponseDetailsDto> {
    const collection = await this.collectionsService.upsertCollection(
      upsertCollectionDto,
      user
    );

    return new CollectionResponseDetailsDto(collection);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all collections" })
  @ApiPagination()
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search in page titles and descriptions",
    example: "news",
  })
  @ApiSort(["createdAt"])
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAllCollections(
    @Language() language: string,
    @Query() query: Record<string, string>
  ) {
    try {
      const { filter, sort, skip, take } = parseQuery(query);

      const totalItems = await this.collectionsService.countCollections(
        filter,
        language
      );

      const data = await this.collectionsService.findCollections(
        skip,
        take,
        sort,
        filter,
        language
      );

      return {
        meta: createMetaModel({ filter, sort, skip, take }, totalItems),
        data: data.map((item) => new CollectionResponseDetailsDto(item)),
      };
    } catch (error) {
      throw new BadRequestException("Failed to retrieve collections.");
    }
  }

  @Get(":id")
  @ApiOperation({
    summary: "Retrieve collection for admin backoffice",
  })
  @ApiResponse({
    status: 200,
    description: "Collection response",
    type: CollectionResponseDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: "Collection or translation not found",
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getCollection(@Param("id") id: string) {
    try {
      const response = await this.collectionsService.findCollectionById(id);
      return new CollectionResponseDetailsDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve collection.");
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a collection" })
  @ApiResponse({ status: 200, description: "The collection has been deleted" })
  @ApiResponse({ status: 404, description: "Collection not found" })
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteCollection(@Param("id", ValidateObjectIdPipe) id: string) {
    try {
      const result = await this.collectionsService.deleteCollection(id);
      if (!result) {
        throw new NotFoundException(`Collection with ID "${id}" not found.`);
      }
      return { message: `Collection with ID "${id}" has been deleted.` };
    } catch (error) {
      throw new BadRequestException("Failed to delete the collection.");
    }
  }

  @Get("web/:slug")
  @ApiOperation({
    summary: "Retrieve collection for public web in specific language",
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
    description: "Collection response with selected translation",
    type: CollectionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Collection or translation not found",
  })
  async getCollectionForWeb(
    @Param("slug") slug: string,
    @Query("lang") language: string,
    @Query("fallback") fallbackLanguage?: string
  ) {
    try {
      const response = await this.collectionsService.findCollectionForWeb(
        slug,
        language,
        fallbackLanguage
      );
      return new CollectionResponseDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve collection for web.");
    }
  }
}
