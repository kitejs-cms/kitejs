import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { IStorageProvider } from "./storage-provider.interface";
import { S3StorageProvider } from "./providers/s3-storage.provider";
import { LocalStorageProvider } from "./providers/local-storage.provider";
import { Storage, StorageDocument } from "./storage.schema";
import { UploadResultModel } from "./models/upload-result.model";
import { DirectoryNodeModel } from "./models/fs-node.model";
import {
  SettingsService,
  STORAGE_SETTINGS_KEY,
  StorageSettingsModel,
} from "../settings";

@Injectable()
export class StorageService {
  private providerMap: Record<string, IStorageProvider>;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly s3Provider: S3StorageProvider,
    private readonly localProvider: LocalStorageProvider,
    @InjectModel(Storage.name) private storageModel: Model<StorageDocument>
  ) {
    this.providerMap = { s3: this.s3Provider, local: this.localProvider };
  }

  /**
   * Uploads a file using the provider configured in the settings and saves its metadata in the DB.
   * Optionally accepts a subdirectory where the file will be stored.
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

    return uploadResult;
  }

  /**
   * Removes a file using the provider configured in the settings.
   * Also removes the associated document from the DB.
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
   * Retrieves the directory structure starting from the specified rootPath.
   */
  async getDirectoryStructure(): Promise<DirectoryNodeModel> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const selectedProvider = this.providerMap[value.provider];
    return selectedProvider.getDirectoryStructure();
  }

  /**
   * Creates an empty directory at the specified path.
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
   * Renames a file or directory using the configured provider.
   * @param oldPath - The current path of the item.
   * @param newPath - The desired new path.
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
   * Moves a file or directory to a new location using the configured provider.
   * @param sourcePath - The current path of the item.
   * @param destinationPath - The new destination path for the item.
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
   * Copies a file or directory to a new location using the configured provider.
   * @param sourcePath - The current path of the item.
   * @param destinationPath - The destination path for the copy.
   */
  async copyPath(sourcePath: string, destinationPath: string): Promise<void> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const selectedProvider = this.providerMap[value.provider];
    return selectedProvider.copyPath(sourcePath, destinationPath);
  }
}
