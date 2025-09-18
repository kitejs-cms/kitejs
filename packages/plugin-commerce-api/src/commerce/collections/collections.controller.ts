import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  GetAuthUser,
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
  ValidateObjectIdPipe,
} from "@kitejs-cms/core";
import type { JwtPayloadModel } from "@kitejs-cms/core";
import { CollectionsService } from "./collections.service";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";
import { CollectionResponseDto } from "./dto/collection-response.dto";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../constants";

@ApiTags("Commerce - Collections")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("commerce/collections")
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:collections.create`)
  @ApiOperation({ summary: "Create a new collection" })
  @ApiResponse({
    status: 201,
    description: "Collection created",
    type: CollectionResponseDto,
  })
  async create(
    @Body() dto: CreateCollectionDto,
    @GetAuthUser() user: JwtPayloadModel
  ) {
    const collection = await this.collectionsService.create(dto, user);
    return new CollectionResponseDto(collection);
  }

  @Get()
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:collections.read`)
  @ApiOperation({ summary: "List collections" })
  @ApiResponse({
    status: 200,
    description: "List of collections",
    type: [CollectionResponseDto],
  })
  async findAll() {
    const collections = await this.collectionsService.findAll();
    return collections.map((collection) => new CollectionResponseDto(collection));
  }

  @Get(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:collections.read`)
  @ApiOperation({ summary: "Retrieve a collection" })
  @ApiResponse({
    status: 200,
    description: "Collection detail",
    type: CollectionResponseDto,
  })
  async findOne(@Param("id", ValidateObjectIdPipe) id: string) {
    const collection = await this.collectionsService.findOne(id);
    return new CollectionResponseDto(collection);
  }

  @Patch(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:collections.update`)
  @ApiOperation({ summary: "Update a collection" })
  @ApiResponse({
    status: 200,
    description: "Collection updated",
    type: CollectionResponseDto,
  })
  async update(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body() dto: UpdateCollectionDto,
    @GetAuthUser() user: JwtPayloadModel
  ) {
    const collection = await this.collectionsService.update(id, dto, user);
    return new CollectionResponseDto(collection);
  }

  @Delete(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:collections.delete`)
  @ApiOperation({ summary: "Delete a collection" })
  @ApiResponse({ status: 204, description: "Collection deleted" })
  async remove(@Param("id", ValidateObjectIdPipe) id: string) {
    await this.collectionsService.remove(id);
    return { status: "ok" };
  }
}
