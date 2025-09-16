import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ProductCollection,
  ProductCollectionDocument,
} from "../schemas/product-collection.schema";
import { CreateCollectionDto } from "../dto/create-collection.dto";
import { UpdateCollectionDto } from "../dto/update-collection.dto";

@Injectable()
export class CollectionsService {
  constructor(
    @InjectModel(ProductCollection.name)
    private readonly collectionModel: Model<ProductCollectionDocument>
  ) {}

  private mapParent(parentId?: string) {
    if (!parentId) return undefined;
    return new Types.ObjectId(parentId);
  }

  async create(dto: CreateCollectionDto): Promise<ProductCollectionDocument> {
    const { parentId, metadata, seo, ...rest } = dto;

    return this.collectionModel.create({
      ...rest,
      tags: rest.tags ?? [],
      parent: this.mapParent(parentId),
      metadata: metadata ?? {},
      seo: seo ? { ...seo } : undefined,
    });
  }

  async findAll(): Promise<ProductCollectionDocument[]> {
    return this.collectionModel.find().sort({ sortOrder: 1 }).exec();
  }

  async findOne(id: string): Promise<ProductCollectionDocument> {
    const collection = await this.collectionModel.findById(id).exec();
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }
    return collection;
  }

  async update(
    id: string,
    dto: UpdateCollectionDto
  ): Promise<ProductCollectionDocument> {
    const { parentId, metadata, seo, ...rest } = dto;

    const updateData: Record<string, unknown> = {
      ...rest,
    };

    if (parentId !== undefined) {
      updateData.parent = parentId ? this.mapParent(parentId) : null;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    if (seo) {
      updateData.seo = { ...seo };
    }

    const collection = await this.collectionModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    return collection;
  }

  async remove(id: string): Promise<void> {
    const result = await this.collectionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }

    await this.collectionModel
      .updateMany(
        { parent: new Types.ObjectId(id) },
        { $unset: { parent: 1 } }
      )
      .exec();
  }
}
