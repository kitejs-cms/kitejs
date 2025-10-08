import { COMMERCE_PRODUCT_SLUG_NAMESPACE } from "../../constants";
import { Product, ProductDocument } from "./schemas/product.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  JwtPayloadModel,
  ObjectIdUtils,
  SlugRegistryService,
  User,
} from "@kitejs-cms/core";

import type { ProductResponseDetailsModel } from "./models/product-response-details.model";
import type { ProductTranslationModel } from "./models/partials/product-translation.model";
import type { ProductResponseModel } from "./models/product-response.model";
import type { ProductUpsertModel } from "./models/product-upsert.model";

type ProductWithUsers = Product & { createdBy: User; updatedBy: User };

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private readonly slugNamespace = COMMERCE_PRODUCT_SLUG_NAMESPACE;

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly slugService: SlugRegistryService
  ) {}

  /**
   * Builds the MongoDB query object based on filters and language for products
   * @param filters Optional filters for isActive, parent, and search
   * @param language Language code for translations search
   * @returns Record<string, any> MongoDB query object
   */
  private buildProductQuery(
    filters?: Record<string, string>,
    language = "en"
  ): Record<string, any> {
    const query: any = { ...filters, deletedAt: null };

    // Handle search filter
    if (filters.search) {
      const searchTerm = filters.search.trim();

      if (searchTerm) {
        const searchConditions = [
          { tags: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          {
            [`translations.${language}.title`]: {
              $regex: searchTerm,
              $options: "i",
            },
          },
          {
            [`translations.${language}.description`]: {
              $regex: searchTerm,
              $options: "i",
            },
          },
        ];

        query.$or = searchConditions;
      }
      delete query.search;
    }

    return query;
  }

  /**
   * Creates or updates a product.
   * @param productData Data for the new or existing product.
   * @param user Authenticated user details.
   * @returns The created or updated product details.
   * @throws BadRequestException if the product cannot be created or updated.
   */
  async upsertProduct(
    productData: ProductUpsertModel,
    user: JwtPayloadModel
  ): Promise<ProductResponseDetailsModel> {
    try {
      const { id, language, status, ...restData } = productData;
      const productBaseData = {
        tags: restData.tags,
        updatedBy: user.sub,
        parent,
        status,
      };

      const translationData = {
        title: restData.title,
        description: restData.description,
        slug: restData.slug,
        seo: restData.seo,
      };

      let product: Product;

      if (id) {
        product = await this.productModel.findByIdAndUpdate(
          id,
          {
            ...productBaseData,
            $set: { [`translations.${language}`]: translationData },
          },
          { new: true, upsert: false }
        );

        if (!product) {
          throw new NotFoundException(`Product with ID ${id} not found`);
        }

        await this.slugService.registerSlug(
          restData.slug,
          this.slugNamespace,
          ObjectIdUtils.toObjectId(product.id),
          language
        );
      } else {
        product = await this.productModel.create({
          ...productBaseData,
          createdBy: user.sub,
          translations: {
            [language]: translationData,
          },
        });

        await this.slugService.registerSlug(
          restData.slug,
          this.slugNamespace,
          ObjectIdUtils.toObjectId(product.id),
          language
        );
      }

      return this.findProductById(product._id.toString());
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to upsert product: ${errorMessage}`
      );
    }
  }

  /**
   * Counts the total number of products.
   * @returns Total number of products.
   * @throws BadRequestException if an error occurs.
   */
  async countProducts(
    filters?: Record<string, string>,
    language = "en"
  ): Promise<number> {
    try {
      const query = this.buildProductQuery(filters, language);

      return await this.productModel.countDocuments(query).exec();
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to count products. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a full product document by its unique identifier (slug or _id).
   * This method handles cases where slugs are managed externally.
   *
   * @param identify The unique identifier (slug or _id).
   * @returns The full product document, or null if not found.
   * @throws BadRequestException if the query fails.
   */
  async findProduct(
    identify: string
  ): Promise<ProductResponseDetailsModel | null> {
    try {
      let product:
        | (ProductDocument & { createdBy: User; updatedBy: User })
        | null = null;

      if (Types.ObjectId.isValid(identify)) {
        product = await this.productModel
          .findById(identify)
          .populate<{ createdBy: User }>("createdBy")
          .populate<{ updatedBy: User }>("updatedBy")
          .lean<ProductWithUsers>()
          .exec();
      } else {
        const slugEntry = await this.slugService.findEntityBySlug(
          identify,
          this.slugNamespace
        );

        if (!slugEntry) {
          throw new NotFoundException(`No product found for slug: ${identify}`);
        }

        product = await this.productModel
          .findById(slugEntry)
          .populate<{ createdBy: User }>("createdBy")
          .populate<{ updatedBy: User }>("updatedBy")
          .lean<ProductWithUsers>()
          .exec();
      }

      if (!product) return null;

      const translations: Record<string, ProductTranslationModel> = {};
      const allSlugs = await this.slugService.findSlugsByEntity(product.id);

      for (const key of Object.keys(product.translations)) {
        translations[key] = {
          ...(product.translations[key] as ProductTranslationModel),
          slug: allSlugs.find((s) => s.language === key)?.slug,
        };
      }

      return {
        ...(product as unknown as ProductResponseDetailsModel),
        translations,
        collections: product.collections.map((c) => c.toString()),
        createdBy: product.createdBy ? product.createdBy.toJSON() : null,
        updatedBy: product.updatedBy ? product.updatedBy.toJSON() : null,
      };
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch product. ${errorMessage}`);
    }
  }

  /**
   * Retrieves a single product with detailed response model.
   * @param id The product ID.
   * @returns The product with response details.
   * @throws NotFoundException if not found.
   * @throws BadRequestException on errors.
   */
  async findProductById(id: string): Promise<ProductResponseDetailsModel> {
    try {
      const product: ProductWithUsers = await this.productModel
        .findById(id)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .lean<ProductWithUsers>()
        .exec();

      if (!product) {
        throw new NotFoundException(`Product with ID "${id}" not found.`);
      }

      const slugs = await this.slugService.findSlugsByEntity(
        new Types.ObjectId(id)
      );

      const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
        acc[cur.language] = cur.slug;
        return acc;
      }, {});

      const json = product.toJSON();
      const translationsWithSlug: Record<string, ProductTranslationModel> = {};
      for (const [lang, trans] of Object.entries(json.translations)) {
        translationsWithSlug[lang] = {
          ...(trans as unknown as ProductTranslationModel),
          slug: slugMap[lang] ?? "",
        };
      }

      return {
        ...(json as unknown as ProductResponseDetailsModel),
        translations: translationsWithSlug,
        collections: product.collections.map((c) => c.toString()),
        createdBy: json.createdBy ? json.createdBy : null,
        updatedBy: json.updatedBy ? json.updatedBy : null,
      };
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch product by ID. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a paginated list of product.
   * @param pageNumber Product number (default: 1).
   * @param itemsPerPage Number of items per page (default: 10).
   * @returns An array of products.
   * @throws BadRequestException if the query fails.
   */
  async findProducts(
    skip = 0,
    take = 10,
    sort?: Record<string, any>,
    filters?: Record<string, string>,
    language = "en"
  ): Promise<ProductResponseDetailsModel[]> {
    try {
      const query = await this.buildProductQuery(filters, language);

      const products = await this.productModel
        .find(query)
        .skip(skip)
        .limit(take)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .sort(sort ?? { createdAt: -1 })
        .lean<ProductWithUsers[]>()
        .exec();

      const productsRes: ProductResponseDetailsModel[] = [];

      for (const item of products) {
        const slugs = await this.slugService.findSlugsByEntity(item.id);

        const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
          acc[cur.language] = cur.slug;
          return acc;
        }, {});

        const translationsWithSlug: Record<string, ProductTranslationModel> =
          {};
        for (const [lang, trans] of Object.entries(item.translations)) {
          translationsWithSlug[lang] = {
            ...(trans as unknown as ProductTranslationModel),
            slug: slugMap[lang] ?? "",
          };
        }

        productsRes.push({
          ...(item as unknown as ProductResponseDetailsModel),
          translations: translationsWithSlug,
          collections: item.collections.map((c) => c.toString()),
          createdBy: item.createdBy
            ? `${item.createdBy.firstName} ${item.createdBy.lastName}`
            : null,
          updatedBy: item.updatedBy
            ? `${item.updatedBy.firstName} ${item.updatedBy.lastName}`
            : null,
        });
      }

      return productsRes;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch products. ${errorMessage}`
      );
    }
  }

  /**
   * Deletes a product by its ID.
   * @param id The ID of the product.
   * @returns True if deleted successfully, false otherwise.
   * @throws BadRequestException if deletion fails.
   */
  async deleteProduct(id: string): Promise<boolean> {
    const result = await this.productModel.findByIdAndDelete(id).exec();

    if (!result) throw new NotFoundException(`Product with ID ${id} not found`);

    try {
      const slugs = await this.slugService.findSlugsByEntity(
        result._id as Types.ObjectId
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

      return result !== null;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to delete product. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a product for frontend consumption with a single translation.
   * It returns the product with only the translation corresponding to the requested language.
   *
   * If the requested language is not available, an optional fallback language is used.
   * The response excludes the full translations map.
   *
   * @param identify The unique identifier (slug or _id).
   * @param language The desired language code (e.g., 'en', 'it').
   * @param fallbackLanguage Optional fallback language if the requested language is missing.
   * @returns A ProductResponseDto containing product core properties and the selected translation.
   * @throws NotFoundException if the language or translation is not found.
   */
  async findProductForWeb(
    identify: string,
    language: string,
    fallbackLanguage?: string
  ): Promise<ProductResponseModel> {
    const product = await this.findProduct(identify);
    if (!product) {
      throw new NotFoundException(
        `Product not found for identifier: ${identify}`
      );
    }

    const translations = product.translations as Record<
      string,
      ProductTranslationModel
    >;

    let selectedTranslation = translations[language];

    if (!selectedTranslation && fallbackLanguage) {
      selectedTranslation = translations[fallbackLanguage];
    }

    if (!selectedTranslation) {
      throw new NotFoundException(
        `Translation not found for language: ${language}` +
          (fallbackLanguage ? ` and fallback: ${fallbackLanguage}` : "")
      );
    }

    const response: ProductResponseModel = {
      slug: selectedTranslation.slug,
      tags: product.tags,
      title: selectedTranslation.title,
      description: selectedTranslation.description,
      language: language,
      status: product.status,
      id: product.id,
    };

    return response;
  }
}
