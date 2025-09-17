import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ProductCollection,
  ProductCollectionDocument,
} from "./schemas/product-collection.schema";
import { CreateCollectionDto } from "./dto/create-collection.dto";
import { UpdateCollectionDto } from "./dto/update-collection.dto";
import { COMMERCE_COLLECTION_SLUG_NAMESPACE } from "../../constants";
import {
  JwtPayloadModel,
  SlugRegistryService,
} from "@kitejs-cms/core";
import { CollectionResponse } from "./dto/collection-response.dto";

@Injectable()
export class CollectionsService {
  private readonly slugNamespace = COMMERCE_COLLECTION_SLUG_NAMESPACE;

  constructor(
    @InjectModel(ProductCollection.name)
    private readonly collectionModel: Model<ProductCollectionDocument>,
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

  private mapParent(parentId?: string) {
    if (!parentId) return undefined;
    return this.toObjectId(parentId);
  }

  private async buildResponse(
    collection: ProductCollection
  ): Promise<CollectionResponse> {
    const slugs = await this.slugService.findSlugsByEntity(
      collection._id as Types.ObjectId
    );

    const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
      const languageKey = cur.language ?? "default";
      acc[languageKey] = cur.slug;
      return acc;
    }, {});

    const json = collection.toJSON();
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
      id: collection._id.toString(),
      translations: translationsWithSlug,
      slugs: slugMap,
    };
  }

  private async upsertCollection(
    id: string | undefined,
    dto: CreateCollectionDto | UpdateCollectionDto,
    user: JwtPayloadModel
  ): Promise<CollectionResponse> {
    const {
      slug,
      language,
      title,
      description,
      seo,
      status,
      tags,
      publishAt,
      expireAt,
      coverImage,
      parentId,
      sortOrder,
    } = dto;

    const translationData = {
      title,
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

    if (coverImage !== undefined) {
      baseData.coverImage = coverImage ?? null;
    }

    const parentObjectId = this.mapParent(parentId);
    if (parentId !== undefined) {
      baseData.parent = parentObjectId ?? null;
    } else if (!id) {
      baseData.parent = null;
    }

    if (sortOrder !== undefined) {
      baseData.sortOrder = sortOrder;
    } else if (!id) {
      baseData.sortOrder = 0;
    }

    let collection: ProductCollection;

    if (id) {
      const updateDoc: Record<string, unknown> = {
        ...baseData,
        $set: { [`translations.${language}`]: translationData },
      };

      collection = await this.collectionModel
        .findByIdAndUpdate(id, updateDoc, { new: true })
        .exec();

      if (!collection) {
        throw new NotFoundException(`Collection with ID ${id} not found`);
      }
    } else {
      const createDoc: Record<string, unknown> = {
        ...baseData,
        createdBy: this.toObjectId(user.sub),
        translations: {
          [language]: translationData,
        },
      };

      collection = await this.collectionModel.create(createDoc);
    }

    await this.slugService.registerSlug(
      slug,
      this.slugNamespace,
      collection._id as Types.ObjectId,
      language
    );

    return this.buildResponse(collection);
  }

  async create(dto: CreateCollectionDto, user: JwtPayloadModel) {
    return this.upsertCollection(undefined, dto, user);
  }

  async findAll(): Promise<CollectionResponse[]> {
    const collections = await this.collectionModel
      .find()
      .sort({ sortOrder: 1, updatedAt: -1 })
      .exec();

    return Promise.all(
      collections.map((collection) => this.buildResponse(collection))
    );
  }

  async findOne(id: string): Promise<CollectionResponse> {
    const collection = await this.collectionModel.findById(id).exec();
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return this.buildResponse(collection);
  }

  async update(
    id: string,
    dto: UpdateCollectionDto,
    user: JwtPayloadModel
  ): Promise<CollectionResponse> {
    return this.upsertCollection(id, dto, user);
  }

  async remove(id: string): Promise<void> {
    const collection = await this.collectionModel.findByIdAndDelete(id).exec();
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    const slugs = await this.slugService.findSlugsByEntity(
      collection._id as Types.ObjectId
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

    await this.collectionModel
      .updateMany({ parent: collection._id }, { $unset: { parent: 1 } })
      .exec();
  }
}
