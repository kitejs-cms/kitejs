import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Page } from "../schemas/page.schema";
import { PageUpsertDto } from "../dto/page-upsert.dto";
import { PageResponseDto } from "../dto/page-response.dto";
import { PageResponseDetailsModel } from "../models/page-response-details.model";
import { SlugRegistryService } from "../../slug-registry";
import { User } from "../../users/schemas/user.schema";
import { PageTranslationModel } from "../models/page-translation.model";
import { JwtPayloadModel } from "../../auth/models/payload-jwt.model";
import { ObjectIdUtils } from "../../../common";
import { PageStatus } from "../models/page-status.enum";
import { CORE_NAMESPACE } from "../../../constants";
import { CategoriesService, Category } from "../../categories";
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";

type FilterModel = { status?: PageStatus; type?: string, category?: string }

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);
  private readonly slugPageNamespace = `${CORE_NAMESPACE}:pages`;
  private readonly slugPostNamespace = `${CORE_NAMESPACE}:posts`;

  constructor(
    @InjectModel(Page.name) private readonly pageModel: Model<Page>,
    private readonly categoriesService: CategoriesService,
    private readonly slugService: SlugRegistryService
  ) { }

  /**
   * Counts the total number of pages with optional filters.
   * @param filters Optional filters for status and type
   * @returns Total number of pages matching the filters.
   * @throws BadRequestException if an error occurs.
   */
  async countPages(filters?: FilterModel): Promise<number> {
    try {
      const query: FilterModel & { categories?: string } = {};
      if (filters?.status) query.status = filters.status;
      if (filters?.type) query.type = filters.type;

      if (filters?.category) {
        const category = await this.categoriesService.findCategory(filters.category)
        query.categories = category._id.toString()
      }

      return await this.pageModel.countDocuments(query).exec();
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to count pages. ${errorMessage}`);
    }
  }

  /**
   * Creates a new page.
   * @param pageData Data for the new page.
   * @param user Auth user.
   * @returns The created page.
   * @throws BadRequestException if the page cannot be created.
   */
  async upsertPage(
    pageData: PageUpsertDto,
    user: JwtPayloadModel
  ): Promise<PageResponseDetailsModel> {
    try {
      const { id, language, type, categories, ...restData } = pageData;
      const pageBaseData = {
        status: restData.status,
        tags: restData.tags,
        publishAt: restData.publishAt,
        expireAt: restData.expireAt,
        updatedBy: user.sub,
        type,
        categories
      };

      const translationData = {
        title: restData.title,
        description: restData.description,
        slug: restData.slug,
        blocks: restData.blocks,
        seo: restData.seo,
      };

      let page: Page;

      if (id) {
        page = await this.pageModel.findByIdAndUpdate(
          id,
          {
            ...pageBaseData,
            $set: { [`translations.${language}`]: translationData },
          },
          { new: true, upsert: false }
        );

        if (!page) {
          throw new NotFoundException(`Page with ID ${id} not found`);
        }

        await this.slugService.registerSlug(
          restData.slug,
          type === "Post" ? this.slugPostNamespace : this.slugPageNamespace,
          ObjectIdUtils.toObjectId(page.id),
          language
        );
      } else {
        page = await this.pageModel.create({
          ...pageBaseData,
          createdBy: user.sub,
          translations: {
            [language]: translationData,
          },
        });

        await this.slugService.registerSlug(
          restData.slug,
          type === "Post" ? this.slugPostNamespace : this.slugPageNamespace,
          ObjectIdUtils.toObjectId(page.id),
          language
        );
      }

      return this.findPageById(page._id.toString());
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to upsert page: ${errorMessage}`);
    }
  }

  /**
   * Retrieves a full page document by its unique identifier (slug or _id).
   * This method handles cases where slugs are managed externally.
   *
   * @param identify The unique identifier (slug or _id).
   * @returns The full page document, or null if not found.
   * @throws BadRequestException if the query fails.
   */
  async findPage(identify: string, type: string): Promise<Page | null> {
    try {
      let page: Page | null;
      if (Types.ObjectId.isValid(identify)) {
        // If the identifier is a valid ObjectId, query by _id
        page = await this.pageModel.findById(identify).exec();
      } else {
        // Otherwise, resolve the slug and query by _id
        const slugEntry = await this.slugService.findEntityBySlug(
          identify,
          type === "Post" ? this.slugPostNamespace : this.slugPageNamespace,
        );

        if (!slugEntry) {
          throw new NotFoundException(`No page found for slug: ${identify}`);
        }

        page = await this.pageModel.findById(slugEntry).exec();
      }

      return page;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch page. ${errorMessage}`);
    }
  }

  /**
   * Retrieves a page for frontend consumption with a single translation.
   * It returns the page with only the translation corresponding to the requested language.
   *
   * If the requested language is not available, an optional fallback language is used.
   * The response excludes the full translations map.
   *
   * @param identify The unique identifier (slug or _id).
   * @param language The desired language code (e.g., 'en', 'it').
   * @param fallbackLanguage Optional fallback language if the requested language is missing.
   * @returns A PageResponseDto containing page core properties and the selected translation.
   * @throws NotFoundException if the page or translation is not found.
   */
  async findPageForWeb(
    identify: string,
    language: string,
    type: string,
    fallbackLanguage?: string,
  ): Promise<PageResponseDto> {
    // Retrieve the full page document
    const page = await this.findPage(identify, type);
    if (!page) {
      throw new NotFoundException(`Page not found for identifier: ${identify}`);
    }

    // Convert the Mongoose document to a plain object
    const pageData = page.toJSON();

    // Cast translations as a record keyed by language code
    const translations = pageData.translations as Record<
      string,
      PageTranslationModel
    >;

    // Attempt to get the requested translation
    let selectedTranslation = translations[language];

    // Use fallback language if the desired translation is missing
    if (!selectedTranslation && fallbackLanguage) {
      selectedTranslation = translations[fallbackLanguage];
    }

    if (!selectedTranslation) {
      throw new NotFoundException(
        `Translation not found for language: ${language}` +
        (fallbackLanguage ? ` and fallback: ${fallbackLanguage}` : "")
      );
    }

    const response: PageResponseDto = {
      slug: pageData.slug,
      status: pageData.status,
      tags: pageData.tags,
      publishAt: pageData.publishAt,
      title: selectedTranslation.title,
      description: selectedTranslation.description,
      blocks: selectedTranslation.blocks,
      seo: selectedTranslation.seo,
      language: language,
    };

    return response;
  }

  /**
   * Retrieves a single page with detailed response model.
   * @param id The page ID.
   * @returns The page with response details.
   * @throws NotFoundException if not found.
   * @throws BadRequestException on errors.
   */
  async findPageById(id: string): Promise<PageResponseDetailsModel> {
    try {
      const page = await this.pageModel
        .findById(id)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .populate<{ categories: Category[] }>("categories")
        .exec();

      if (!page) {
        throw new NotFoundException(`Page with ID "${id}" not found.`);
      }

      const slugs = await this.slugService.findSlugsByEntity(
        new Types.ObjectId(id)
      );

      const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
        acc[cur.language] = cur.slug;
        return acc;
      }, {});

      const json = page.toJSON();
      const translationsWithSlug: Record<string, PageTranslationModel> = {};
      for (const [lang, trans] of Object.entries(json.translations)) {
        translationsWithSlug[lang] = {
          ...(trans as unknown as PageTranslationModel),
          slug: slugMap[lang] ?? "",
        };
      }

      return {
        ...json,
        categories: json.categories.map(item => item._id.toString()),
        createdBy: `${page.createdBy.firstName} ${page.createdBy.lastName}`,
        updatedBy: `${page.updatedBy.firstName} ${page.updatedBy.lastName}`,
        translations: translationsWithSlug,
      } as unknown as PageResponseDetailsModel;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch page by ID. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a paginated list of pages with optional filters.
   * @param pageNumber Page number (default: 1).
   * @param itemsPerPage Number of items per page (default: 10).
   * @param filters Optional filters for status and type.
   * @returns An array of pages.
   * @throws BadRequestException if the query fails.
   */
  async findPages(
    pageNumber = 1,
    itemsPerPage = 10,
    filters?: FilterModel
  ): Promise<PageResponseDetailsModel[]> {
    try {
      const skip = (pageNumber - 1) * itemsPerPage;

      const query: FilterModel & { categories?: string } = {};
      if (filters?.status) query.status = filters.status;
      if (filters?.type) query.type = filters.type;
      if (filters?.category) {
        const category = await this.categoriesService.findCategory(filters.category)
        query.categories = category._id.toString()
      }

      const pages = await this.pageModel
        .find(query)
        .skip(skip)
        .limit(itemsPerPage)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .populate<{ categories: Category[] }>("categories")
        .exec();

      const pagesRes: PageResponseDetailsModel[] = [];

      for (const item of pages) {
        const slugs = await this.slugService.findSlugsByEntity(item.id);

        const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
          acc[cur.language] = cur.slug;
          return acc;
        }, {});

        const json = item.toJSON();
        const translationsWithSlug: Record<string, PageTranslationModel> = {};

        for (const [lang, trans] of Object.entries(json.translations)) {
          translationsWithSlug[lang] = {
            ...(trans as unknown as PageTranslationModel),
            slug: slugMap[lang] ?? "",
          };
        }

        const categories: string[] = []
        for (const category of json.categories) {
          for (const [, trans] of Object.entries(category.translations)) {
            categories.push(trans.title)
          }
        }

        pagesRes.push({
          ...json,
          translations: translationsWithSlug,
          createdBy: `${item.createdBy.firstName} ${item.createdBy.lastName}`,
          updatedBy: `${item.updatedBy.firstName} ${item.updatedBy.lastName}`,
          categories,
        } as unknown as PageResponseDetailsModel);
      }

      return pagesRes;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch pages. ${errorMessage}`);
    }
  }

  /**
   * Deletes an existing page.
   * @param id The page ID.
   * @returns True if the page was deleted; false otherwise.
   * @throws BadRequestException if the deletion fails.
   */
  async deletePage(id: string): Promise<boolean> {
    try {
      const result = await this.pageModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to delete page. ${errorMessage}`);
    }
  }
}
