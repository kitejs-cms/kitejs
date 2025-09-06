import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, PipelineStage, Types } from "mongoose";
import { Gallery } from "../schemas/gallery.schema";
import { GalleryUpsertDto } from "../dto/gallery-upsert.dto";
import { GalleryItemDto } from "../dto/gallery-item.dto";
import {
  SlugRegistryService,
  StorageService,
  SettingsService,
  processCustomFields,
} from "@kitejs-cms/core";
import type { JwtPayloadModel } from "@kitejs-cms/core";
import {
  GALLERY_SLUG_NAMESPACE,
  GALLERY_PLUGIN_NAMESPACE,
  GALLERY_SETTINGS_KEY,
  type GalleryPluginSettingsModel,
} from "../../constants";
import { GalleryResponseModel } from "../models/gallery-response.model";
import { GalleryTranslationModel } from "../models/gallery-translation.model";
import { GalleryStatus } from "../models/gallery-status.enum";
import { GalleryItem } from "../schemas/gallery-item.schema";
import { User } from "@kitejs-cms/core";

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(Gallery.name) private readonly galleryModel: Model<Gallery>,
    private readonly slugService: SlugRegistryService,
    private readonly storageService: StorageService,
    private readonly settingsService: SettingsService
  ) {}

  async upsertGallery(
    dto: GalleryUpsertDto,
    user: JwtPayloadModel
  ): Promise<GalleryResponseModel> {
    const { value } =
      await this.settingsService.findOne<GalleryPluginSettingsModel>(
        GALLERY_PLUGIN_NAMESPACE,
        GALLERY_SETTINGS_KEY
      );
    const { customFields = [] } = value || {};

    const { id, slug, language, ...rest } = dto;

    const translationData = {
      title: rest.title,
      description: rest.description,
      seo: rest.seo,
    };

    type BaseData = Pick<
      GalleryUpsertDto,
      "status" | "tags" | "publishAt" | "expireAt" | "items" | "settings"
    >;

    const baseData: BaseData = {
      status: rest.status,
      tags: rest.tags,
      publishAt: rest.publishAt,
      expireAt: rest.expireAt,
      items: rest.items?.map((item, idx) => ({
        ...(item.id ? { _id: new Types.ObjectId(item.id) } : {}),
        assetId: new Types.ObjectId(item.assetId),
        order: item.order ?? idx,
        caption: item.caption,
        altOverride: item.altOverride,
        linkUrl: item.linkUrl,
        visibility: item.visibility,
      })) as unknown as GalleryItemDto[],
      settings: rest.settings,
    };

    let customFieldsData = {};
    if (customFields.length > 0) {
      customFieldsData = processCustomFields(customFields, rest);
    }

    let gallery: Gallery;

    if (id) {
      const updateData = {
        ...baseData,
        ...(customFields.length > 0 ? customFieldsData : {}),
        updatedBy: user.sub,
        $set: { [`translations.${language}`]: translationData },
      };
      gallery = await this.galleryModel.findByIdAndUpdate(id, updateData, {
        new: true,
        upsert: false,
        strict: customFields.length === 0,
      });
      if (!gallery) {
        throw new NotFoundException(`Gallery with ID ${id} not found`);
      }
    } else {
      const createData = {
        ...baseData,
        ...(customFields.length > 0 ? customFieldsData : {}),
        createdBy: user.sub,
        updatedBy: user.sub,
        translations: { [language]: translationData },
      };
      if (customFields.length > 0) {
        gallery = new this.galleryModel(createData, null, { strict: false });
        await gallery.save();
      } else {
        gallery = await this.galleryModel.create(createData);
      }
    }

    await this.slugService.registerSlug(
      slug,
      GALLERY_SLUG_NAMESPACE,
      gallery._id as Types.ObjectId,
      language
    );

    return this.findGalleryById(gallery._id.toString());
  }

  async findGalleryById(id: string): Promise<GalleryResponseModel> {
    try {
      const gallery = await this.galleryModel
        .findById(id)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .exec();
      if (!gallery) {
        throw new NotFoundException(`Gallery with ID ${id} not found`);
      }

      const slugs = await this.slugService.findSlugsByEntity(
        gallery._id as Types.ObjectId
      );

      const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
        acc[cur.language] = cur.slug;
        return acc;
      }, {});

      const json = gallery.toJSON();
      const sortedItems = [...json.items].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      );
      const translationsWithSlug: Record<string, GalleryTranslationModel> = {};
      for (const [lang, trans] of Object.entries(json.translations)) {
        translationsWithSlug[lang] = {
          ...(trans as unknown as GalleryTranslationModel),
          slug: slugMap[lang] ?? "",
        };
      }

      return {
        ...json,
        items: sortedItems,
        id: json._id.toString(),
        createdBy: `${(json.createdBy as User).firstName} ${(json.createdBy as User).lastName}`,
        updatedBy: `${(json.updatedBy as User).firstName} ${(json.updatedBy as User).lastName}`,
        translations: translationsWithSlug,
      } as unknown as GalleryResponseModel;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch gallery. ${message}`);
    }
  }

  private async buildGalleryQuery(
    filters?: { status?: GalleryStatus; search?: string },
    language = "en"
  ): Promise<Record<string, unknown>> {
    const query: Record<string, unknown> = { ...filters };

    if (filters?.search) {
      const searchTerm = filters.search.trim();
      if (searchTerm) {
        query.$or = [
          { tags: { $regex: searchTerm, $options: "i" } },
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
      }
      delete query.search;
    }

    return query;
  }

  async countGalleries(
    filters?: { status?: GalleryStatus; search?: string },
    language = "en"
  ): Promise<number> {
    try {
      const query = await this.buildGalleryQuery(filters, language);
      return this.galleryModel.countDocuments(query).exec();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to count galleries. ${message}`);
    }
  }

  async findGalleries(
    skip = 0,
    take = 10,
    sort?: Record<string, 1 | -1>,
    filters?: { status?: GalleryStatus; search?: string },
    language = "en"
  ): Promise<GalleryResponseModel[]> {
    try {
      const query = await this.buildGalleryQuery(filters, language);
      const galleries = await this.galleryModel
        .find(query)
        .skip(skip)
        .limit(take)
        .sort(sort ?? { updatedAt: -1 })
        .exec();

      const results: GalleryResponseModel[] = [];
      for (const gallery of galleries) {
        results.push(await this.findGalleryById(gallery._id.toString()));
      }
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch galleries. ${message}`);
    }
  }

  async findGalleriesForWeb(
    skip = 0,
    take = 10,
    sort?: Record<string, 1 | -1>,
    filters?: { status?: GalleryStatus; search?: string },
    language = "en"
  ): Promise<GalleryResponseModel[]> {
    const baseFilters = {
      ...filters,
      status: filters?.status ?? GalleryStatus.Published,
    };
    const query = await this.buildGalleryQuery(baseFilters, language);
    const now = new Date();
    query.$and = [
      { $or: [{ publishAt: null }, { publishAt: { $lte: now } }] },
      { $or: [{ expireAt: null }, { expireAt: { $gte: now } }] },
    ];

    const galleries = await this.galleryModel
      .find(query)
      .skip(skip)
      .limit(take)
      .sort(sort ?? { publishAt: -1 })
      .exec();

    const results: GalleryResponseModel[] = [];
    for (const gallery of galleries) {
      results.push(await this.findGalleryById(gallery._id.toString()));
    }
    return results;
  }
  async findGalleryForWeb(
    slug: string,
    language: string
  ): Promise<GalleryResponseModel> {
    const entityId = await this.slugService.findEntityBySlug(
      slug,
      GALLERY_SLUG_NAMESPACE,
      language
    );

    if (!entityId) {
      throw new NotFoundException(`Gallery with slug '${slug}' not found`);
    }

    return this.findGalleryById(entityId.toString());
  }

  async deleteGallery(id: string): Promise<boolean> {
    try {
      const res = await this.galleryModel.findByIdAndDelete(id).exec();
      return res !== null;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to delete gallery. ${message}`);
    }
  }

  async uploadItemFile(
    galleryId: string,
    file: Express.Multer.File
  ): Promise<{ assetId: string; filename: string; path: string; url: string }> {
    const dir = `galleries/${galleryId}`;
    const result = await this.storageService.uploadFile(file, dir);
    return { assetId: result.path, ...result };
  }

  async addItem(
    galleryId: string,
    item: GalleryItemDto,
    user: JwtPayloadModel
  ): Promise<GalleryResponseModel> {
    const gallery = await this.galleryModel.findByIdAndUpdate(
      galleryId,
      { $push: { items: item }, updatedBy: user.sub },
      { new: true }
    );

    if (!gallery) {
      throw new NotFoundException(`Gallery with ID ${galleryId} not found`);
    }

    return this.findGalleryById(galleryId);
  }

  async removeItem(
    galleryId: string,
    itemId: string,
    user: JwtPayloadModel
  ): Promise<GalleryResponseModel> {
    const gallery = await this.galleryModel.findByIdAndUpdate(
      galleryId,
      { $pull: { items: { _id: itemId } }, updatedBy: user.sub },
      { new: true }
    );

    if (!gallery) {
      throw new NotFoundException(
        `Gallery with ID ${galleryId} or item ${itemId} not found`
      );
    }

    return this.findGalleryById(galleryId);
  }

  async sortItems(
    galleryId: string,
    itemIds: string[],
    user: JwtPayloadModel
  ): Promise<GalleryResponseModel> {
    const gallery = await this.galleryModel.findById(galleryId).exec();
    if (!gallery) {
      throw new NotFoundException(`Gallery with ID ${galleryId} not found`);
    }

    type GalleryItemWithId = GalleryItem & { _id: Types.ObjectId };

    const itemsMap = new Map<string, GalleryItemWithId>(
      gallery.items.map((item) => {
        const itemWithId = item as unknown as GalleryItemWithId;
        return [(itemWithId._id as Types.ObjectId).toString(), itemWithId];
      })
    );

    const reordered: GalleryItemWithId[] = [];
    for (let index = 0; index < itemIds.length; index++) {
      const id = itemIds[index];
      const item = itemsMap.get(id);
      if (!item) {
        throw new BadRequestException(
          `Item with ID ${id} not found in gallery`
        );
      }
      item.order = index;
      reordered.push(item);
      itemsMap.delete(id);
    }

    for (const item of itemsMap.values()) {
      item.order = reordered.length;
      reordered.push(item);
    }

    gallery.set({ items: reordered, updatedBy: user.sub });
    await gallery.save();

    return this.findGalleryById(galleryId);
  }

  private buildItemsPipeline(
    galleryId: string,
    filter?: { search?: string }
  ): PipelineStage[] {
    const pid = new Types.ObjectId(galleryId);
    const stages: PipelineStage[] = [
      { $match: { _id: pid } },
      { $unwind: "$items" },
    ];

    if (filter?.search?.trim()) {
      const term = filter.search.trim();
      stages.push({
        $match: {
          $or: [
            { "items.caption": { $regex: term, $options: "i" } },
            { "items.altOverride": { $regex: term, $options: "i" } },
          ],
        },
      });
    }

    return stages;
  }

  async countGalleryItemsForWeb(
    galleryId: string,
    filter?: { search?: string }
  ): Promise<number> {
    const pipeline: PipelineStage[] = [
      ...this.buildItemsPipeline(galleryId, filter),
      { $count: "total" },
    ];

    const res = await this.galleryModel
      .aggregate<{ total: number }>(pipeline)
      .exec();
    return res[0]?.total ?? 0;
  }

  async findGalleryItemsForWeb(
    galleryId: string,
    skip = 0,
    take = 12,
    sort?: Record<string, 1 | -1>,
    filter?: { search?: string }
  ): Promise<any[]> {
    const sortStage: PipelineStage.Sort = {
      $sort:
        sort && Object.keys(sort).length
          ? Object.fromEntries(
              Object.entries(sort).map(([k, v]) => [`items.${k}`, v])
            )
          : { "items.order": 1, "items._id": 1 },
    };

    const pipeline: PipelineStage[] = [
      ...this.buildItemsPipeline(galleryId, filter),
      sortStage,
      { $skip: Math.max(0, skip) },
      { $limit: Math.max(1, take) },
      { $replaceRoot: { newRoot: "$items" } },
    ];

    const docs = await this.galleryModel.aggregate<any>(pipeline).exec();

    return docs.map((it: any) => ({
      ...it,
      id: it._id?.toString?.() ?? it.id,
    }));
  }
}
