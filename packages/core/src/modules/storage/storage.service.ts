import {
  SettingsService,
  STORAGE_SETTINGS_KEY,
  type StorageSettingsModel,
} from "../settings";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { IStorageProvider } from "./storage-provider.interface";
import { S3StorageProvider } from "./providers/s3-storage.provider";
import { LocalStorageProvider } from "./providers/local-storage.provider";
import { Storage, StorageDocument } from "./storage.schema";
import { getLocalizedValue, setLocalizedValue } from "../../common/utils/localized";
import type { UpdateStorageMetadata } from "./models/update-storage-metadata.model";
import type { UploadResultModel } from "./models/upload-result.model";
import type { DirectoryNodeModel } from "./models/fs-node.model";
import type { StorageResponseModel } from "./models/storage-response.model";
import type { StorageResponseDetailsModel } from "./models/storage-response-details.model";

@Injectable()
export class StorageService {
  private providerMap: Record<string, IStorageProvider>;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly s3Provider: S3StorageProvider,
    private readonly localProvider: LocalStorageProvider,
    @InjectModel(Storage.name) private storageModel: Model<StorageDocument>
  ) {
    this.providerMap = {
      s3: this.s3Provider,
      local: this.localProvider,
    };
  }

  /**
   * Uploads a file using the configured storage provider
   * and stores its metadata in the database.
   */
  async uploadFile(
    file: Express.Multer.File,
    dir?: string
  ): Promise<UploadResultModel> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );

    const selectedProvider = this.providerMap[value.provider];
    const uploadResult = await selectedProvider.uploadFile(file, dir);

    const newStorage = new this.storageModel({
      fileName: uploadResult.filename,
      filePath: uploadResult.path,
      mediaType: file.mimetype,
      size: file.size,
      url: uploadResult.url,
    });

    await newStorage.save();

    return { ...uploadResult, assetId: newStorage._id.toString() };
  }

  /**
   * Deletes a file using the configured provider and removes
   * its corresponding document from the database.
   */
  async removeFile(filePath: string): Promise<void> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );

    const selectedProvider = this.providerMap[value.provider];
    await selectedProvider.removeFile(filePath);
    await this.storageModel.deleteOne({ filePath }).exec();
  }

  /**
   * Returns a valid, accessible URL for a given asset ID or file path.
   * Uses the correct provider to handle public/private logic.
   */
  async getFileUrl(assetIdOrPath: string): Promise<string> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );

    const selectedProvider = this.providerMap[value.provider];

    // Try to resolve by MongoDB ID
    const asset = await this.storageModel
      .findById(assetIdOrPath)
      .lean()
      .exec()
      .catch(() => null);

    const path = asset ? asset.filePath : assetIdOrPath;
    return selectedProvider.getFileUrl(path);
  }

  /**
   * Returns the directory tree structure using the selected provider.
   */
  async getDirectoryStructure(): Promise<StorageResponseModel> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const selectedProvider = this.providerMap[value.provider];
    return selectedProvider.getDirectoryStructure();
  }

  /**
   * Creates an empty directory using the configured provider.
   */
  async createEmptyDirectory(directoryPath: string): Promise<void> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const selectedProvider = this.providerMap[value.provider];
    return selectedProvider.createEmptyDirectory(directoryPath);
  }

  /**
   * Renames a file or directory.
   */
  async renamePath(oldPath: string, newPath: string): Promise<void> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const selectedProvider = this.providerMap[value.provider];
    return selectedProvider.renamePath(oldPath, newPath);
  }

  /**
   * Moves a file or directory to a new location.
   */
  async movePath(sourcePath: string, destinationPath: string): Promise<void> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const selectedProvider = this.providerMap[value.provider];
    return selectedProvider.movePath(sourcePath, destinationPath);
  }

  /**
   * Copies a file or directory to a new location.
   */
  async copyPath(sourcePath: string, destinationPath: string): Promise<void> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const selectedProvider = this.providerMap[value.provider];
    return selectedProvider.copyPath(sourcePath, destinationPath);
  }

  /**
   * Updates metadata fields (e.g. alt, title, description, etc.)
   * for a stored media document in MongoDB.
   */
  async updateMetadata(
    assetId: string,
    updateData: UpdateStorageMetadata
  ): Promise<StorageResponseModel> {
    const asset = await this.storageModel.findById(assetId);

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    const { language } = updateData;

    if (!language) {
      throw new BadRequestException("Language is required to update metadata");
    }

    if (typeof updateData.alt === "string") {
      asset.alt = setLocalizedValue(asset.alt, language, updateData.alt);
    }

    if (typeof updateData.title === "string") {
      asset.title = setLocalizedValue(asset.title, language, updateData.title);
    }

    if (typeof updateData.description === "string") {
      asset.description = setLocalizedValue(
        asset.description,
        language,
        updateData.description
      );
    }

    if (updateData.mediaType) {
      asset.mediaType = updateData.mediaType;
    }

    if (typeof updateData.size === "number") {
      asset.size = updateData.size;
    }

    if (updateData.url) {
      asset.url = updateData.url;
    }

    await asset.save();

    return this.getAssetById(assetId, language);
  }

  /**
   * Retrieves a single stored media asset by its ID and returns
   * a localized StorageResponseModel for the specified language.
   */
  async getAssetById(
    assetId: string,
    lang: string
  ): Promise<StorageResponseModel> {
    const asset = await this.storageModel.findById(assetId).lean().exec();

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    // Get resolved URL (handles signed URLs or local paths)
    const fileUrl = await this.getFileUrl(asset.filePath);

    const response: StorageResponseModel = {
      id: asset._id?.toString(),
      name: asset.fileName,
      path: asset.filePath,
      type: "file",
      url: fileUrl,
      alt: getLocalizedValue(asset.alt, lang),
      title: getLocalizedValue(asset.title, lang),
      description: getLocalizedValue(asset.description, lang),
    };

    return response;
  }

  /**
   * Retrieves multiple stored media assets by their IDs and returns
   * an array of localized StorageResponseModel objects.
   * Optimized to minimize DB and storage provider access.
   */
  async getAssetsByIds(
    assetIds: string[],
    lang: string
  ): Promise<StorageResponseModel[]> {
    if (!assetIds || assetIds.length === 0) return [];

    const assets = await this.storageModel
      .find({ _id: { $in: assetIds } })
      .lean()
      .exec();

    if (!assets || assets.length === 0) return [];

    // Resolve URLs in parallel
    const urls = await Promise.all(
      assets.map((asset) => this.getFileUrl(asset.filePath))
    );

    // Build localized response array
    const response: StorageResponseModel[] = assets.map((asset, index) => ({
      id: asset._id?.toString(),
      name: asset.fileName,
      path: asset.filePath,
      type: "file",
      url: urls[index],
      alt: getLocalizedValue(asset.alt, lang),
      title: getLocalizedValue(asset.title, lang),
      description: getLocalizedValue(asset.description, lang),
    }));

    return response;
  }

  /**
   * Retrieves a single stored media asset with all translations.
   * Useful for admin panels or dashboards where full metadata is needed.
   */
  async getAssetDetails(assetId: string): Promise<StorageResponseDetailsModel> {
    const asset = await this.storageModel.findById(assetId).lean().exec();

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${assetId} not found`);
    }

    const fileUrl = await this.getFileUrl(asset.filePath);

    const response: StorageResponseDetailsModel = {
      id: asset._id?.toString(),
      name: asset.fileName,
      path: asset.filePath,
      type: "file",
      url: fileUrl,
      alt: asset.alt,
      title: asset.title,
      description: asset.description,
      mediaType: asset.mediaType,
      size: asset.size,
      dimensions: asset.dimensions,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };

    return response;
  }

  /**
   * Retrieves multiple stored media assets (bulk) with all translations.
   * Optimized to minimize DB and provider calls.
   */
  async getAssetsDetails(
    assetIds: string[]
  ): Promise<StorageResponseDetailsModel[]> {
    if (!assetIds || assetIds.length === 0) return [];

    const assets = await this.storageModel
      .find({ _id: { $in: assetIds } })
      .lean()
      .exec();

    if (!assets || assets.length === 0) return [];

    const urls = await Promise.all(
      assets.map((asset) => this.getFileUrl(asset.filePath))
    );

    const response: StorageResponseDetailsModel[] = assets.map(
      (asset, index) => ({
        id: asset._id?.toString(),
        name: asset.fileName,
        path: asset.filePath,
        type: "file",
        url: urls[index],
        alt: asset.alt,
        title: asset.title,
        description: asset.description,
        mediaType: asset.mediaType,
        size: asset.size,
        dimensions: asset.dimensions,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      })
    );

    return response;
  }
}
