import { COMMERCE_COLLECTION_SLUG_NAMESPACE } from "../../constants";
import { ObjectIdUtils, SlugRegistryService } from "@kitejs-cms/core";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ProductCollection } from "./schemas/product-collection.schema";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";

import type { CollectionResponseDetailslModel } from "./models/collection-response-details.model";
import type { CollectionTranslationModel } from "./models/collection-translation.model";
import type { CollectionResponseModel } from "./models/collection-response.model";
import type { JwtPayloadModel, User } from "@kitejs-cms/core";
import type { CollectionUpsertModel } from "./models/collection-upsert.model";

@Injectable()
export class CollectionsService {
  private readonly logger = new Logger(CollectionsService.name);
  private readonly slugNamespace = COMMERCE_COLLECTION_SLUG_NAMESPACE;

  constructor(
    @InjectModel(ProductCollection.name)
    private readonly collectionModel: Model<ProductCollection>,
    private readonly slugService: SlugRegistryService
  ) {}

  /**
   * Builds the MongoDB query object based on filters and language for collections
   * @param filters Optional filters for isActive, parent, and search
   * @param language Language code for translations search
   * @returns Record<string, any> MongoDB query object
   */
  private buildCollectionQuery(
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
   * Counts the total number of collections (optional: you can pass filters in the future).
   * @returns Total number of collections.
   * @throws BadRequestException if an error occurs.
   */
  async countCollections(
    filters?: Record<string, string>,
    language = "en"
  ): Promise<number> {
    try {
      const query = this.buildCollectionQuery(filters, language);

      return await this.collectionModel.countDocuments(query).exec();
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to count collections. ${errorMessage}`
      );
    }
  }

  /**
   * Creates or updates a collection.
   * @param collectionData Data for the new or existing collection.
   * @param user Authenticated user details.
   * @returns The created or updated collection details.
   * @throws BadRequestException if the collection cannot be created or updated.
   */
  async upsertCollection(
    collectionData: CollectionUpsertModel,
    user: JwtPayloadModel
  ): Promise<CollectionResponseDetailslModel> {
    try {
      const { id, language, parent, status, ...restData } = collectionData;
      const collectionBaseData = {
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

      let collection: ProductCollection;

      if (id) {
        collection = await this.collectionModel.findByIdAndUpdate(
          id,
          {
            ...collectionBaseData,
            $set: { [`translations.${language}`]: translationData },
          },
          { new: true, upsert: false }
        );

        if (!collection) {
          throw new NotFoundException(`Collection with ID ${id} not found`);
        }

        await this.slugService.registerSlug(
          restData.slug,
          this.slugNamespace,
          ObjectIdUtils.toObjectId(collection.id),
          language
        );
      } else {
        collection = await this.collectionModel.create({
          ...collectionBaseData,
          createdBy: user.sub,
          translations: {
            [language]: translationData,
          },
        });

        await this.slugService.registerSlug(
          restData.slug,
          this.slugNamespace,
          ObjectIdUtils.toObjectId(collection.id),
          language
        );
      }

      return this.findCollectionById(collection._id.toString());
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to upsert collection: ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a full collection document by its unique identifier (slug or _id).
   * This method handles cases where slugs are managed externally.
   *
   * @param identify The unique identifier (slug or _id).
   * @returns The full collection document, or null if not found.
   * @throws BadRequestException if the query fails.
   */
  async findCollection(identify: string): Promise<ProductCollection | null> {
    try {
      let collection: ProductCollection | null;

      if (Types.ObjectId.isValid(identify)) {
        collection = await this.collectionModel.findById(identify).exec();
      } else {
        const slugEntry = await this.slugService.findEntityBySlug(
          identify,
          this.slugNamespace
        );

        if (!slugEntry) {
          throw new NotFoundException(
            `No collection found for slug: ${identify}`
          );
        }

        collection = await this.collectionModel.findById(slugEntry).exec();
      }

      return collection;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch collection. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a collection for frontend consumption with a single translation.
   * It returns the collection with only the translation corresponding to the requested language.
   *
   * If the requested language is not available, an optional fallback language is used.
   * The response excludes the full translations map.
   *
   * @param identify The unique identifier (slug or _id).
   * @param language The desired language code (e.g., 'en', 'it').
   * @param fallbackLanguage Optional fallback language if the requested language is missing.
   * @returns A CollectionResponseDto containing collection core properties and the selected translation.
   * @throws NotFoundException if the collection or translation is not found.
   */
  async findCollectionForWeb(
    identify: string,
    language: string,
    fallbackLanguage?: string
  ): Promise<CollectionResponseModel> {
    const collection = await this.findCollection(identify);
    if (!collection) {
      throw new NotFoundException(
        `Collection not found for identifier: ${identify}`
      );
    }

    const collectionData = collection.toJSON();

    const translations = collectionData.translations as Record<
      string,
      CollectionTranslationModel
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

    const response: CollectionResponseModel = {
      slug: selectedTranslation.slug,
      tags: collectionData.tags,
      title: selectedTranslation.title,
      description: selectedTranslation.description,
      language: language,
      status: collectionData.status,
      id: collectionData.id,
    };

    return response;
  }

  /**
   * Retrieves a single collection with detailed response model.
   * @param id The collection ID.
   * @returns The collection with response details.
   * @throws NotFoundException if not found.
   * @throws BadRequestException on errors.
   */
  async findCollectionById(
    id: string
  ): Promise<CollectionResponseDetailslModel> {
    try {
      const collection = await this.collectionModel
        .findById(id)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .exec();

      if (!collection) {
        throw new NotFoundException(`Collection with ID "${id}" not found.`);
      }

      const slugs = await this.slugService.findSlugsByEntity(
        new Types.ObjectId(id)
      );

      const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
        acc[cur.language] = cur.slug;
        return acc;
      }, {});

      const json = collection.toJSON();
      const translationsWithSlug: Record<string, CollectionTranslationModel> =
        {};
      for (const [lang, trans] of Object.entries(json.translations)) {
        translationsWithSlug[lang] = {
          ...(trans as unknown as CollectionTranslationModel),
          slug: slugMap[lang] ?? "",
        };
      }

      return {
        ...json,
        parent: json.parent ? json.parent.toString() : undefined,
        createdBy: `${collection.createdBy.firstName} ${collection.createdBy.lastName}`,
        updatedBy: `${collection.updatedBy.firstName} ${collection.updatedBy.lastName}`,
        translations: translationsWithSlug,
      } as unknown as CollectionResponseDetailslModel;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch collection by ID. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a paginated list of collection.
   * @param pageNumber Collection number (default: 1).
   * @param itemsPerPage Number of items per page (default: 10).
   * @returns An array of collections.
   * @throws BadRequestException if the query fails.
   */
  async findCollections(
    skip = 0,
    take = 10,
    sort?: Record<string, any>,
    filters?: Record<string, string>,
    language = "en"
  ): Promise<CollectionResponseDetailslModel[]> {
    try {
      const query = await this.buildCollectionQuery(filters, language);

      const collections = await this.collectionModel
        .find(query)
        .skip(skip)
        .limit(take)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .sort(sort ?? { createdAt: -1 })
        .exec();

      const collectionsRes: CollectionResponseDetailslModel[] = [];

      for (const item of collections) {
        const slugs = await this.slugService.findSlugsByEntity(item.id);

        const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
          acc[cur.language] = cur.slug;
          return acc;
        }, {});

        const json = item.toJSON();
        const translationsWithSlug: Record<string, CollectionTranslationModel> =
          {};
        for (const [lang, trans] of Object.entries(json.translations)) {
          translationsWithSlug[lang] = {
            ...(trans as unknown as CollectionTranslationModel),
            slug: slugMap[lang] ?? "",
          };
        }

        collectionsRes.push({
          ...json,
          translations: translationsWithSlug,
          createdBy: `${item.createdBy.firstName} ${item.createdBy.lastName}`,
          updatedBy: `${item.updatedBy.firstName} ${item.updatedBy.lastName}`,
        } as unknown as CollectionResponseDetailslModel);
      }

      return collectionsRes;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch collections. ${errorMessage}`
      );
    }
  }

  /**
   * Deletes a collection by its ID.
   * @param id The ID of the collection.
   * @returns True if deleted successfully, false otherwise.
   * @throws BadRequestException if deletion fails.
   */
  async deleteCollection(id: string): Promise<boolean> {
    const result = await this.collectionModel.findByIdAndDelete(id).exec();

    if (!result)
      throw new NotFoundException(`Collection with ID ${id} not found`);

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
        `Failed to delete collection. ${errorMessage}`
      );
    }
  }
}
