import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Category } from "./schemas/categories.schema";
import { CategoryTranslationModel } from "./models/category-translation.model";
import { CategoryResponseDetailsModel } from "./models/category-response-details.model";
import { CategoryUpsertDto } from "./dto/category-upsert.dto";
import { CategoryResponseDto } from "./dto/category-response.dto";
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { CORE_NAMESPACE } from "../../constants";
import { SlugRegistryService } from "../../modules/slug-registry";
import { JwtPayloadModel } from "../../modules/auth";
import { ObjectIdUtils } from "../../common";
import { User } from "../../modules/users";

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  private readonly slugNamespace = `${CORE_NAMESPACE}:categories`;

  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    private readonly slugService: SlugRegistryService
  ) {}

  /**
   * Builds the MongoDB query object based on filters and language for categories
   * @param filters Optional filters for isActive, parent, and search
   * @param language Language code for translations search
   * @returns Record<string, any> MongoDB query object
   */
  private buildCategoryQuery(
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
   * Counts the total number of categories (optional: you can pass filters in the future).
   * @returns Total number of categories.
   * @throws BadRequestException if an error occurs.
   */
  async countCategories(
    filters?: Record<string, string>,
    language = "en"
  ): Promise<number> {
    try {
      const query = await this.buildCategoryQuery(filters, language);

      return await this.categoryModel.countDocuments(query).exec();
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to count categories. ${errorMessage}`
      );
    }
  }

  /**
   * Creates or updates a category.
   * @param categoryData Data for the new or existing category.
   * @param user Authenticated user details.
   * @returns The created or updated category details.
   * @throws BadRequestException if the category cannot be created or updated.
   */
  async upsertCategory(
    categoryData: CategoryUpsertDto,
    user: JwtPayloadModel
  ): Promise<CategoryResponseDetailsModel> {
    try {
      const { id, language, ...restData } = categoryData;
      const categoryBaseData = {
        tags: restData.tags,
        updatedBy: user.sub,
        isActive: restData.isActive,
      };

      const translationData = {
        title: restData.title,
        description: restData.description,
        slug: restData.slug,
      };

      let category: Category;

      if (id) {
        category = await this.categoryModel.findByIdAndUpdate(
          id,
          {
            ...categoryBaseData,
            $set: { [`translations.${language}`]: translationData },
          },
          { new: true, upsert: false }
        );

        if (!category) {
          throw new NotFoundException(`Category with ID ${id} not found`);
        }

        await this.slugService.registerSlug(
          restData.slug,
          this.slugNamespace,
          ObjectIdUtils.toObjectId(category.id),
          language
        );
      } else {
        category = await this.categoryModel.create({
          ...categoryBaseData,
          createdBy: user.sub,
          translations: {
            [language]: translationData,
          },
        });

        await this.slugService.registerSlug(
          restData.slug,
          this.slugNamespace,
          ObjectIdUtils.toObjectId(category.id),
          language
        );
      }

      return this.findCategoryById(category._id.toString());
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to upsert category: ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a full category document by its unique identifier (slug or _id).
   * This method handles cases where slugs are managed externally.
   *
   * @param identify The unique identifier (slug or _id).
   * @returns The full category document, or null if not found.
   * @throws BadRequestException if the query fails.
   */
  async findCategory(identify: string): Promise<Category | null> {
    try {
      let category: Category | null;

      if (Types.ObjectId.isValid(identify)) {
        category = await this.categoryModel.findById(identify).exec();
      } else {
        const slugEntry = await this.slugService.findEntityBySlug(
          identify,
          this.slugNamespace
        );

        if (!slugEntry) {
          throw new NotFoundException(
            `No category found for slug: ${identify}`
          );
        }

        category = await this.categoryModel.findById(slugEntry).exec();
      }

      return category;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch category. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a category for frontend consumption with a single translation.
   * It returns the category with only the translation corresponding to the requested language.
   *
   * If the requested language is not available, an optional fallback language is used.
   * The response excludes the full translations map.
   *
   * @param identify The unique identifier (slug or _id).
   * @param language The desired language code (e.g., 'en', 'it').
   * @param fallbackLanguage Optional fallback language if the requested language is missing.
   * @returns A CategoryResponseDto containing category core properties and the selected translation.
   * @throws NotFoundException if the category or translation is not found.
   */
  async findCategoryForWeb(
    identify: string,
    language: string,
    fallbackLanguage?: string
  ): Promise<CategoryResponseDto> {
    const category = await this.findCategory(identify);
    if (!category) {
      throw new NotFoundException(
        `Category not found for identifier: ${identify}`
      );
    }

    const categoryData = category.toJSON();

    const translations = categoryData.translations as Record<
      string,
      CategoryTranslationModel
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

    const response: CategoryResponseDto = {
      slug: selectedTranslation.slug,
      tags: categoryData.tags,
      title: selectedTranslation.title,
      description: selectedTranslation.description,
      language: language,
      isActive: categoryData.isActive,
    };

    return response;
  }

  /**
   * Retrieves a single category with detailed response model.
   * @param id The category ID.
   * @returns The category with response details.
   * @throws NotFoundException if not found.
   * @throws BadRequestException on errors.
   */
  async findCategoryById(id: string): Promise<CategoryResponseDetailsModel> {
    try {
      const category = await this.categoryModel
        .findById(id)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .populate<{ parent?: Category }>("parent")
        .exec();

      if (!category) {
        throw new NotFoundException(`Category with ID "${id}" not found.`);
      }

      const slugs = await this.slugService.findSlugsByEntity(
        new Types.ObjectId(id)
      );

      const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
        acc[cur.language] = cur.slug;
        return acc;
      }, {});

      const json = category.toJSON();
      const translationsWithSlug: Record<string, CategoryTranslationModel> = {};
      for (const [lang, trans] of Object.entries(json.translations)) {
        translationsWithSlug[lang] = {
          ...(trans as unknown as CategoryTranslationModel),
          slug: slugMap[lang] ?? "",
        };
      }

      return {
        ...json,
        createdBy: `${category.createdBy.firstName} ${category.createdBy.lastName}`,
        updatedBy: `${category.updatedBy.firstName} ${category.updatedBy.lastName}`,
        translations: translationsWithSlug,
      } as unknown as CategoryResponseDetailsModel;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch category by ID. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a paginated list of categories.
   * @param pageNumber Category number (default: 1).
   * @param itemsPerPage Number of items per page (default: 10).
   * @returns An array of categories.
   * @throws BadRequestException if the query fails.
   */
  async findCategories(
    skip = 0,
    take = 10,
    sort?: Record<string, any>,
    filters?: Record<string, string>,
    language = "en"
  ): Promise<CategoryResponseDetailsModel[]> {
    try {
      const query = await this.buildCategoryQuery(filters, language);

      const categories = await this.categoryModel
        .find(query)
        .skip(skip)
        .limit(take)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .sort(sort ?? { createdAt: -1 })
        .exec();

      const categoriesRes: CategoryResponseDetailsModel[] = [];

      for (const item of categories) {
        const slugs = await this.slugService.findSlugsByEntity(item.id);

        const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
          acc[cur.language] = cur.slug;
          return acc;
        }, {});

        const json = item.toJSON();
        const translationsWithSlug: Record<string, CategoryTranslationModel> =
          {};
        for (const [lang, trans] of Object.entries(json.translations)) {
          translationsWithSlug[lang] = {
            ...(trans as unknown as CategoryTranslationModel),
            slug: slugMap[lang] ?? "",
          };
        }

        categoriesRes.push({
          ...json,
          translations: translationsWithSlug,
          createdBy: `${item.createdBy.firstName} ${item.createdBy.lastName}`,
          updatedBy: `${item.updatedBy.firstName} ${item.updatedBy.lastName}`,
        } as unknown as CategoryResponseDetailsModel);
      }

      return categoriesRes;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch categories. ${errorMessage}`
      );
    }
  }

  /**
   * Deletes a category by its ID.
   * @param id The ID of the category.
   * @returns True if deleted successfully, false otherwise.
   * @throws BadRequestException if deletion fails.
   */
  async deleteCategory(id: string): Promise<boolean> {
    try {
      const result = await this.categoryModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to delete category. ${errorMessage}`
      );
    }
  }
}
