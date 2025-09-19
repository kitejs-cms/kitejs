import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { Product, ProductDocument } from "./schemas/product.schema";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductVariantDto } from "./dto/product-variant.dto";
import { ProductPriceDto } from "./dto/product-price.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductStatus } from "./models/product-status.enum";
import { COMMERCE_PRODUCT_SLUG_NAMESPACE } from "../../constants";
import { SlugRegistryService } from "@kitejs-cms/core";
import type { JwtPayloadModel } from "@kitejs-cms/core";
import type { ProductResponseModel } from "./models/product-response.model";

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly slugNamespace = COMMERCE_PRODUCT_SLUG_NAMESPACE;

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly slugService: SlugRegistryService
  ) {}

  private buildProductQuery(
    filters?: Record<string, string>,
    language = "en"
  ): FilterQuery<ProductDocument> {
    if (!filters) {
      return {};
    }

    const { status, collectionId, tags, search } = filters;

    const tagValues = tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const trimmedSearch = search?.trim();

    return {
      ...(status ? { status: status as ProductStatus } : {}),
      ...(collectionId ? { collections: this.toObjectId(collectionId) } : {}),
      ...(tagValues?.length
        ? ({ tags: { $in: tagValues } } as FilterQuery<ProductDocument>)
        : {}),
      ...(trimmedSearch
        ? {
            $or: [
              { tags: { $regex: trimmedSearch, $options: "i" } },
              {
                [`translations.${language}.title`]: {
                  $regex: trimmedSearch,
                  $options: "i",
                },
              },
              {
                [`translations.${language}.subtitle`]: {
                  $regex: trimmedSearch,
                  $options: "i",
                },
              },
              {
                [`translations.${language}.summary`]: {
                  $regex: trimmedSearch,
                  $options: "i",
                },
              },
              {
                [`translations.${language}.description`]: {
                  $regex: trimmedSearch,
                  $options: "i",
                },
              },
            ],
          }
        : {}),
    };
  }

  private toObjectId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid identifier provided: ${id}`);
    }

    return new Types.ObjectId(id);
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
  ): Promise<ProductResponseModel> {
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

    const mappedCollections = this.mapCollectionIds(collectionIds);
    const mappedVariants = this.mapVariants(variants);

    const baseData: Record<string, unknown> = {
      updatedBy: this.toObjectId(user.sub),
      ...(status !== undefined ? { status } : {}),
      ...(tags !== undefined ? { tags } : !id ? { tags: [] } : {}),
      ...(publishAt !== undefined
        ? { publishAt: publishAt ? new Date(publishAt) : null }
        : !id
        ? { publishAt: null }
        : {}),
      ...(expireAt !== undefined
        ? { expireAt: expireAt ? new Date(expireAt) : null }
        : !id
        ? { expireAt: null }
        : {}),
      ...(thumbnail !== undefined ? { thumbnail: thumbnail ?? null } : {}),
      ...(gallery !== undefined
        ? { gallery: gallery ?? [] }
        : !id
        ? { gallery: [] }
        : {}),
      ...(mappedCollections !== undefined
        ? { collections: mappedCollections }
        : !id
        ? { collections: [] }
        : {}),
      ...(mappedVariants !== undefined
        ? { variants: mappedVariants }
        : !id
        ? { variants: [] }
        : {}),
      ...(defaultCurrency !== undefined
        ? { defaultCurrency }
        : !id
        ? { defaultCurrency: "EUR" }
        : {}),
    };

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

  async countProducts(
    filters?: Record<string, string>,
    language = "en"
  ): Promise<number> {
    try {
      const query = this.buildProductQuery(filters, language);
      return await this.productModel.countDocuments(query).exec();
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to count products. ${message}`);
    }
  }

  async findProducts(
    skip = 0,
    take?: number,
    sort?: Record<string, 1 | -1>,
    filters?: Record<string, string>,
    language = "en"
  ): Promise<ProductResponseModel[]> {
    try {
      const query = this.buildProductQuery(filters, language);
      const mongooseQuery = this.productModel
        .find(query)
        .sort(sort ?? { updatedAt: -1 })
        .skip(skip);

      if (typeof take === "number" && take > 0) {
        mongooseQuery.limit(take);
      }

      const products = await mongooseQuery.exec();

      return Promise.all(products.map((product) => this.buildResponse(product)));
    } catch (error) {
      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch products. ${message}`);
    }
  }

  async findAll(): Promise<ProductResponseModel[]> {
    return this.findProducts(0, undefined, { updatedAt: -1 });
  }

  async findOne(id: string): Promise<ProductResponseModel> {
    try {
      const product = await this.productModel.findById(id).exec();

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return this.buildResponse(product);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(error);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch product. ${message}`);
    }
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
