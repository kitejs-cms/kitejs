import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Gallery } from "../schemas/gallery.schema";
import { GalleryUpsertDto } from "../dto/gallery-upsert.dto";
import { GalleryItemDto } from "../dto/gallery-item.dto";
import { SlugRegistryService } from "@kitejs-cms/core";
import type { JwtPayloadModel } from "@kitejs-cms/core";
import { GALLERY_SLUG_NAMESPACE } from "../../constants";
import { GalleryResponseModel } from "../models/gallery-response.model";
import { GalleryTranslationModel } from "../models/gallery-translation.model";

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(Gallery.name) private readonly galleryModel: Model<Gallery>,
    private readonly slugService: SlugRegistryService
  ) {}

  async upsertGallery(
    dto: GalleryUpsertDto,
    user: JwtPayloadModel
  ): Promise<GalleryResponseModel> {
    const { id, slug, language, ...rest } = dto;

    const translationData = {
      title: rest.title,
      description: rest.description,
      seo: rest.seo,
    };

    const baseData: any = {
      status: rest.status,
      tags: rest.tags,
      publishAt: rest.publishAt,
      expireAt: rest.expireAt,
      items: rest.items,
      categories: rest.categories,
    };

    let gallery: Gallery;

    if (id) {
      const updateData = {
        ...baseData,
        updatedBy: user.sub,
        $set: { [`translations.${language}`]: translationData },
      };
      gallery = await this.galleryModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });
      if (!gallery) {
        throw new NotFoundException(`Gallery with ID ${id} not found`);
      }
    } else {
      const createData = {
        ...baseData,
        createdBy: user.sub,
        updatedBy: user.sub,
        translations: { [language]: translationData },
      };
      gallery = await this.galleryModel.create(createData);
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
      const gallery = await this.galleryModel.findById(id).exec();
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
      const translationsWithSlug: Record<string, GalleryTranslationModel> = {};
      for (const [lang, trans] of Object.entries(json.translations)) {
        translationsWithSlug[lang] = {
          ...(trans as unknown as GalleryTranslationModel),
          slug: slugMap[lang] ?? "",
        };
      }

      return {
        ...json,
        id: json._id.toString(),
        translations: translationsWithSlug,
      } as unknown as GalleryResponseModel;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch gallery. ${message}`);
    }
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

    const itemsMap = new Map(
      gallery.items.map((item: any) => [item._id.toString(), item])
    );

    const reordered: typeof gallery.items = [];
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

    gallery.items = reordered as any;
    (gallery as any).updatedBy = user.sub;
    await gallery.save();

    return this.findGalleryById(galleryId);
  }
}

