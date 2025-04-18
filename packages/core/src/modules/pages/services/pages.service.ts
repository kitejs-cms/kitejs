import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Page } from "../schemas/page.schema";
import { CreatePageDto } from "../dto/create-page.dto";
import { UpdatePageDto } from "../dto/update-page.dto";
import { PageResponseDto } from "../dto/page-response.dto";

@Injectable()
export class PagesService {
  constructor(
    @InjectModel(Page.name) private readonly pageModel: Model<Page>
  ) {}

  /**
   * Creates a new page.
   * @param pageData Data for the new page.
   * @returns The created page.
   * @throws BadRequestException if the page cannot be created.
   */
  async createPage(pageData: CreatePageDto): Promise<Page> {
    try {
      const page = new this.pageModel(pageData);
      await page.save();
      return page;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to create page. ${errorMessage}`);
    }
  }

  /**
   * Retrieves a full page document by its unique identifier (slug or _id).
   * This method returns the complete page, including all translations.
   *
   * @param identify The unique identifier (slug or _id).
   * @returns The full page document, or null if not found.
   * @throws BadRequestException if the query fails.
   */
  async findPage(identify: string): Promise<Page | null> {
    try {
      const isObjectId = Types.ObjectId.isValid(identify);
      const query = isObjectId ? { _id: identify } : { slug: identify };
      const page = await this.pageModel.findOne(query).exec();
      return page;
    } catch (error) {
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
    fallbackLanguage?: string
  ): Promise<PageResponseDto> {
    // Retrieve the full page document
    const page = await this.findPage(identify);
    if (!page) {
      throw new NotFoundException(`Page not found for identifier: ${identify}`);
    }

    // Convert the Mongoose document to a plain object
    const pageData = page.toJSON();

    // Cast translations as a record keyed by language code
    const translations = pageData.translations as Record<string, any>;

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

    // Prepare the response matching the PageResponseModel:
    // It contains the core page properties and only the selected translation data.
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
   * Retrieves a paginated list of pages.
   * @param pageNumber Page number (default: 1).
   * @param itemsPerPage Number of items per page (default: 10).
   * @returns An array of pages.
   * @throws BadRequestException if the query fails.
   */
  async findPages(pageNumber = 1, itemsPerPage = 10): Promise<Page[]> {
    try {
      const skip = (pageNumber - 1) * itemsPerPage;
      const pages = await this.pageModel
        .find()
        .skip(skip)
        .limit(itemsPerPage)
        .exec();
      return pages;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch pages. ${errorMessage}`);
    }
  }

  /**
   * Updates an existing page.
   * @param id The page ID.
   * @param updateData Data for updating the page.
   * @returns The updated page or null if not found.
   * @throws BadRequestException if the update fails.
   */
  async updatePage(
    id: string,
    updateData: UpdatePageDto
  ): Promise<Page | null> {
    try {
      const updatedPage = await this.pageModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();
      return updatedPage;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to update page. ${errorMessage}`);
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to delete page. ${errorMessage}`);
    }
  }
}
