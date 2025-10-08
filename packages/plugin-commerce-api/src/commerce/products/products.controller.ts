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
import type { JwtPayloadModel } from "@kitejs-cms/core";
import { ProductResponseDetailsDto } from "./dto/product-response-details.dto";
import { ProductsService } from "./products.service";
import { ProductResponseDto } from "./dto/product-response.dto";
import { ProductUpsertDto } from "./dto/product-upsert.dto";

@ApiTags("Commerce - Products")
//@ApiBearerAuth()
//@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("commerce/products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: "Upsert product" })
  @ApiResponse({
    status: 201,
    description: "The product has been successfully created",
    type: ProductResponseDetailsDto,
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({ status: 400, description: "Invalid input data" })
  async upsertProduct(
    @Body() upsertProductDto: ProductUpsertDto,
    @GetAuthUser() user: JwtPayloadModel
  ): Promise<ProductResponseDetailsDto> {
    const product = await this.productsService.upsertProduct(
      upsertProductDto,
      user
    );

    return new ProductResponseDetailsDto(product);
  }

  @Get()
  @ApiOperation({ summary: "Retrieve all products" })
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
  async getAllProducts(
    @Language() language: string,
    @Query() query: Record<string, string>
  ) {
    try {
      const { filter, sort, skip, take } = parseQuery(query);

      const totalItems = await this.productsService.countProducts(
        filter,
        language
      );

      const data = await this.productsService.findProducts(
        skip,
        take,
        sort,
        filter,
        language
      );

      return {
        meta: createMetaModel({ filter, sort, skip, take }, totalItems),
        data: data.map((item) => new ProductResponseDetailsDto(item)),
      };
    } catch (error) {
      throw new BadRequestException("Failed to retrieve products.");
    }
  }

  @Get(":id")
  @ApiOperation({
    summary: "Retrieve product for admin backoffice",
  })
  @ApiResponse({
    status: 200,
    description: "Product response",
    type: ProductResponseDetailsDto,
  })
  @ApiResponse({
    status: 404,
    description: "Product or translation not found",
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async geProduct(@Param("id") id: string) {
    try {
      const response = await this.productsService.findProduct(id);
      return new ProductResponseDetailsDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve product.");
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a product" })
  @ApiResponse({ status: 200, description: "The product has been deleted" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteProduct(@Param("id", ValidateObjectIdPipe) id: string) {
    try {
      const result = await this.productsService.deleteProduct(id);
      if (!result) {
        throw new NotFoundException(`Product with ID "${id}" not found.`);
      }
      return { message: `Product with ID "${id}" has been deleted.` };
    } catch (error) {
      throw new BadRequestException("Failed to delete the product.");
    }
  }

  @Get("web/:slug")
  @ApiOperation({
    summary: "Retrieve product for public web in specific language",
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
    description: "Product response with selected translation",
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Product or translation not found",
  })
  async getProductForWeb(
    @Param("slug") slug: string,
    @Query("lang") language: string,
    @Query("fallback") fallbackLanguage?: string
  ) {
    try {
      const response = await this.productsService.findProductForWeb(
        slug,
        language,
        fallbackLanguage
      );
      return new ProductResponseDto(response);
    } catch (error) {
      throw new BadRequestException("Failed to retrieve product for web.");
    }
  }
}
