import { Injectable } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import {
  IStorageProvider,
  UploadResult,
  DirectoryNode,
} from "./storage-provider.interface";
import { S3StorageProvider } from "./providers/s3-storage.provider";
import { LocalStorageProvider } from "./providers/local-storage.provider";
import {
  SettingsService,
  STORAGE_SETTINGS_KEY,
  StorageSettingsModel,
} from "../settings";
import { Storage, StorageDocument } from "./storage.schema"; // Assicurati che il path sia corretto

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
  ): Promise<UploadResult> {
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
    });
    await newStorage.save();

    return uploadResult;
  }

  /**
   * Removes a file using the provider configured in the settings.
   * Inoltre, rimuove anche il documento associato nel DB.
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
  async getDirectoryStructure(): Promise<DirectoryNode> {
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
}
