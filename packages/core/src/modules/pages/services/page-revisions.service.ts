import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { PageRevision } from "../schemas/page-revision.schema";
import { Page } from "../schemas/page.schema";

@Injectable()
export class PageRevisionsService {
  constructor(
    @InjectModel(PageRevision.name)
    private readonly revisionModel: Model<PageRevision>
  ) {}

  /**
   * Creates a revision (snapshot) for a page.
   * @param page The page document to snapshot.
   * @param modifiedBy The user ID who modified the page.
   * @param version The version number for the revision.
   * @returns The created page revision document.
   */
  async createRevision(
    page: Page,
    modifiedBy: string,
    version: number
  ): Promise<PageRevision> {
    try {
      const revision = new this.revisionModel({
        pageId: page._id,
        version,
        data: page.toJSON(), // snapshot of the page data
        modifiedBy: new Types.ObjectId(modifiedBy),
        timestamp: new Date(),
      });
      await revision.save();
      return revision;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to create page revision. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves all revisions for a given page.
   * @param pageId The ID of the page.
   * @returns An array of page revision documents.
   */
  async getRevisions(pageId: string): Promise<PageRevision[]> {
    try {
      const revisions = await this.revisionModel
        .find({ pageId: pageId })
        .sort({ version: -1 })
        .exec();
      return revisions;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch page revisions. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a specific revision for a given page.
   * @param pageId The ID of the page.
   * @param version The version number to retrieve.
   * @returns The page revision document or `null` if not found.
   */
  async getRevision(
    pageId: string,
    version: number
  ): Promise<PageRevision | null> {
    try {
      const revision = await this.revisionModel
        .findOne({ pageId, version })
        .exec();
      return revision;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch page revision. ${errorMessage}`
      );
    }
  }
}
