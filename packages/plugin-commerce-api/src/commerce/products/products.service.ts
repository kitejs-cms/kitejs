import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product, ProductDocument } from "./schemas/product.schema";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductVariantDto } from "./dto/product-variant.dto";
import { ProductPriceDto } from "./dto/product-price.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { COMMERCE_PRODUCT_SLUG_NAMESPACE } from "../../constants";
import { SlugRegistryService } from "@kitejs-cms/core";
import type { JwtPayloadModel } from "@kitejs-cms/core";
import { ProductResponseDto } from "./dto/product-response.dto";
import type { ProductResponseModel } from "./models/product-response.model";

@Injectable()
export class ProductsService {
  private readonly slugNamespace = COMMERCE_PRODUCT_SLUG_NAMESPACE;

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly slugService: SlugRegistryService
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    try {
      return new Types.ObjectId(id);
    } catch (error) {
      throw new BadRequestException(`Invalid identifier provided: ${id}`);
    }
  }

  private parseDate(value?: string): Date | null {
    if (value === null) return null;
    return value ? new Date(value) : null;
  }

  private mapCollectionIds(
    collectionIds?: string[]
  ): Types.ObjectId[] | undefined {
    if (collectionIds === undefined) return undefined;
    return collectionIds.filter(Boolean).map((id) => this.toObjectId(id));
  }

  private mapVariantPrices(prices?: ProductPriceDto[]) {
    return (prices ?? []).map((price) => ({
      currencyCode: price.currencyCode,
      amount: price.amount,
      compareAtAmount: price.compareAtAmount,
    }));
  }

  private mapVariants(variants?: ProductVariantDto[]) {
    if (variants === undefined) return undefined;
    return variants.map((variant) => ({
      ...(variant.id ? { _id: this.toObjectId(variant.id) } : {}),
      title: variant.title,
      sku: variant.sku,
      barcode: variant.barcode,
      inventoryQuantity: variant.inventoryQuantity ?? 0,
      allowBackorder: variant.allowBackorder ?? false,
      prices: this.mapVariantPrices(variant.prices),
    }));
  }

  private async buildResponse(product: Product): Promise<ProductResponseModel> {
    const slugs = await this.slugService.findSlugsByEntity(
      product._id as Types.ObjectId
    );

    const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
      const languageKey = cur.language ?? "default";
      acc[languageKey] = cur.slug;
      return acc;
    }, {});

    const json = product.toJSON();
    const translations = json.translations as Record<string, any>;
    const translationsWithSlug: Record<string, any> = {};

    for (const [language, translation] of Object.entries(translations ?? {})) {
      translationsWithSlug[language] = {
        ...(translation as Record<string, unknown>),
        slug: slugMap[language] ?? slugMap.default ?? "",
      };
    }

    return {
      ...json,
      id: product._id.toString(),
      translations: translationsWithSlug,
      slugs: slugMap,
    } as ProductResponseModel;
  }

  private async upsertProduct(
    id: string | undefined,
    dto: CreateProductDto | UpdateProductDto,
    user: JwtPayloadModel
  ): Promise<ProductResponseDto> {
    const {
      slug,
      language,
      title,
      subtitle,
      summary,
      description,
      seo,
      status,
      tags,
      publishAt,
      expireAt,
      thumbnail,
      gallery,
      collectionIds,
      variants,
      defaultCurrency,
    } = dto;

    const translationData = {
      title,
      subtitle,
      summary,
      description,
      seo,
    };

    const baseData: Record<string, unknown> = {
      updatedBy: this.toObjectId(user.sub),
    };

    if (status !== undefined) {
      baseData.status = status;
    }

    if (tags !== undefined) {
      baseData.tags = tags;
    } else if (!id) {
      baseData.tags = [];
    }

    if (publishAt !== undefined) {
      baseData.publishAt = this.parseDate(publishAt);
    } else if (!id) {
      baseData.publishAt = null;
    }

    if (expireAt !== undefined) {
      baseData.expireAt = this.parseDate(expireAt);
    } else if (!id) {
      baseData.expireAt = null;
    }

    if (thumbnail !== undefined) {
      baseData.thumbnail = thumbnail ?? null;
    }

    if (gallery !== undefined) {
      baseData.gallery = gallery ?? [];
    } else if (!id) {
      baseData.gallery = [];
    }

    const mappedCollections = this.mapCollectionIds(collectionIds);
    if (mappedCollections !== undefined) {
      baseData.collections = mappedCollections;
    } else if (!id) {
      baseData.collections = [];
    }

    const mappedVariants = this.mapVariants(variants);
    if (mappedVariants !== undefined) {
      baseData.variants = mappedVariants;
    } else if (!id) {
      baseData.variants = [];
    }

    if (defaultCurrency !== undefined) {
      baseData.defaultCurrency = defaultCurrency;
    } else if (!id) {
      baseData.defaultCurrency = "EUR";
    }

    let product: Product;

    if (id) {
      const updateDoc: Record<string, unknown> = {
        ...baseData,
        $set: { [`translations.${language}`]: translationData },
      };

      product = await this.productModel
        .findByIdAndUpdate(id, updateDoc, { new: true })
        .exec();

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
    } else {
      const createDoc: Record<string, unknown> = {
        ...baseData,
        createdBy: this.toObjectId(user.sub),
        translations: {
          [language]: translationData,
        },
      };

      product = await this.productModel.create(createDoc);
    }

    await this.slugService.registerSlug(
      slug,
      this.slugNamespace,
      product._id as Types.ObjectId,
      language
    );

    return this.buildResponse(product);
  }

  async create(dto: CreateProductDto, user: JwtPayloadModel) {
    return this.upsertProduct(undefined, dto, user);
  }

  async update(id: string, dto: UpdateProductDto, user: JwtPayloadModel) {
    return this.upsertProduct(id, dto, user);
  }

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productModel
      .find()
      .sort({ updatedAt: -1 })
      .exec();

    return Promise.all(products.map((product) => this.buildResponse(product)));
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.productModel.findById(id).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.buildResponse(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productModel.findByIdAndDelete(id).exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    const slugs = await this.slugService.findSlugsByEntity(
      product._id as Types.ObjectId
    );

    await Promise.all(
      slugs.map((entry) =>
        this.slugService.deleteSlug(
          entry.slug,
          this.slugNamespace,
          entry.language ?? undefined
        )
      )
    );
  }
}
