import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product, ProductDocument } from "../schemas/product.schema";
import { CreateProductDto, ProductVariantDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { ProductStatus } from "../models/product-status.enum";

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>
  ) {}

  private mapCollectionIds(collectionIds?: string[]): Types.ObjectId[] | undefined {
    if (!collectionIds) return undefined;
    return collectionIds
      .filter((id) => !!id)
      .map((id) => new Types.ObjectId(id));
  }

  private sanitizeVariants(variants: ProductVariantDto[]) {
    return variants.map((variant) => ({
      ...variant,
      prices: variant.prices?.map((price) => ({ ...price })) ?? [],
      options: variant.options?.map((option) => ({ ...option })) ?? [],
      metadata: variant.metadata ?? {},
    }));
  }

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    const {
      collectionIds,
      publishedAt,
      variants,
      options,
      pricing,
      metadata,
      ...rest
    } = dto;

    const product = await this.productModel.create({
      ...rest,
      status: rest.status ?? ProductStatus.Draft,
      tags: rest.tags ?? [],
      collections: this.mapCollectionIds(collectionIds) ?? [],
      variants: this.sanitizeVariants(variants),
      options: options?.map((option) => ({ ...option })) ?? [],
      pricing: pricing?.map((price) => ({ ...price })) ?? [],
      metadata: metadata ?? {},
      publishedAt: publishedAt ? new Date(publishedAt) : undefined,
    });

    return product;
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel
      .find()
      .populate("collections")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel
      .findById(id)
      .populate("collections")
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const {
      collectionIds,
      publishedAt,
      variants,
      options,
      pricing,
      metadata,
      ...rest
    } = dto;

    const updateData: Record<string, unknown> = {
      ...rest,
    };

    if (collectionIds) {
      updateData.collections = this.mapCollectionIds(collectionIds);
    }

    if (variants) {
      updateData.variants = this.sanitizeVariants(variants);
    }

    if (options) {
      updateData.options = options.map((option) => ({ ...option }));
    }

    if (pricing) {
      updateData.pricing = pricing.map((price) => ({ ...price }));
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    if (publishedAt !== undefined) {
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
      .populate("collections")
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }
}
