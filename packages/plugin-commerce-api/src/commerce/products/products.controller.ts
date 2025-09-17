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
  JwtAuthGuard,
  PermissionsGuard,
  Permissions,
  ValidateObjectIdPipe,
} from "@kitejs-cms/core";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { COMMERCE_PLUGIN_NAMESPACE } from "../../constants";
import { GetAuthUser, JwtPayloadModel } from "@kitejs-cms/core";

@ApiTags("Commerce - Products")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("commerce/products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:products.create`)
  @ApiOperation({ summary: "Create a new product" })
  @ApiResponse({ status: 201, description: "Product created" })
  create(@Body() dto: CreateProductDto, @GetAuthUser() user: JwtPayloadModel) {
    return this.productsService.create(dto, user);
  }

  @Get()
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:products.read`)
  @ApiOperation({ summary: "List products" })
  @ApiResponse({ status: 200, description: "List of products" })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:products.read`)
  @ApiOperation({ summary: "Retrieve a product by id" })
  @ApiResponse({ status: 200, description: "Product detail" })
  findOne(@Param("id", ValidateObjectIdPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:products.update`)
  @ApiOperation({ summary: "Update a product" })
  @ApiResponse({ status: 200, description: "Product updated" })
  update(
    @Param("id", ValidateObjectIdPipe) id: string,
    @Body() dto: UpdateProductDto,
    @GetAuthUser() user: JwtPayloadModel
  ) {
    return this.productsService.update(id, dto, user);
  }

  @Delete(":id")
  @Permissions(`${COMMERCE_PLUGIN_NAMESPACE}:products.delete`)
  @ApiOperation({ summary: "Delete a product" })
  @ApiResponse({ status: 204, description: "Product deleted" })
  async remove(@Param("id", ValidateObjectIdPipe) id: string) {
    await this.productsService.remove(id);
    return { status: "ok" };
  }
}
