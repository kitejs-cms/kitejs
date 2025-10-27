import { IStorageProvider } from "../storage-provider.interface";
import { Injectable, BadRequestException } from "@nestjs/common";
import { UploadResultModel } from "../models/upload-result.model";
import { DirectoryNodeModel } from "../models/fs-node.model";
import * as fs from "fs";
import * as path from "path";
import {
  CMS_SETTINGS_KEY,
  CmsSettingsModel,
  SettingsService,
  STORAGE_SETTINGS_KEY,
  StorageSettingsModel,
} from "../../settings";

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Creates a directory recursively if it does not exist.
   */
  private createDirectory(destination: string): string {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    return destination;
  }

  /**
   * Generates a unique filename in the destination directory.
   * If a file with the same name already exists, adds a numeric suffix.
   */
  private generateFileName(
    originalName: string,
    destinationDir: string
  ): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    let fileName = `${baseName}${ext}`;
    let fullPath = path.join(destinationDir, fileName);
    let counter = 1;

    while (fs.existsSync(fullPath)) {
      fileName = `${baseName}-${counter}${ext}`;
      fullPath = path.join(destinationDir, fileName);
      counter++;
    }

    return fileName;
  }

  /**
   * Uploads a file to the local filesystem and returns metadata including its URL.
   */
  async uploadFile(
    file: Express.Multer.File,
    dir?: string
  ): Promise<Omit<UploadResultModel, "assetId">> {
    if (!file) {
      throw new BadRequestException("Missing file");
    }

    const { value: storageSettings } =
      await this.settingsService.findOne<StorageSettingsModel>(
        "core",
        STORAGE_SETTINGS_KEY
      );

    const { value: cms } = await this.settingsService.findOne<CmsSettingsModel>(
      "core",
      CMS_SETTINGS_KEY
    );

    let baseUrl = cms.apiUrl
      ? cms.apiUrl
      : `http://localhost:${process.env.PORT}`;

    if (storageSettings.local.baseUrl) baseUrl = storageSettings.local.baseUrl;

    const baseUploadPath = storageSettings.local.uploadPath;
    const uploadDirectory = this.createDirectory(baseUploadPath);

    let destinationDir = dir
      ? path.join(uploadDirectory, dir)
      : uploadDirectory;
    destinationDir = this.createDirectory(destinationDir);

    const fileName = this.generateFileName(file.originalname, destinationDir);
    const finalPath = path.join(destinationDir, fileName);

    try {
      await fs.promises.writeFile(finalPath, file.buffer);
    } catch {
      throw new BadRequestException("Error saving file to filesystem");
    }

    return {
      filename: fileName,
      path: dir ? `${dir}/${fileName}` : `${fileName}`,
      url: dir ? `${baseUrl}/${dir}/${fileName}` : `${baseUrl}/${fileName}`,
    };
  }

  /**
   * Retrieves a valid public URL for a given file path.
   * Since local files are always public, no signed URLs are needed.
   */
  async getFileUrl(mediaIdOrPath: string): Promise<string> {
    const { value: storageSettings } =
      await this.settingsService.findOne<StorageSettingsModel>(
        "core",
        STORAGE_SETTINGS_KEY
      );

    const { value: cms } = await this.settingsService.findOne<CmsSettingsModel>(
      "core",
      CMS_SETTINGS_KEY
    );

    let baseUrl = cms.apiUrl
      ? cms.apiUrl
      : `http://localhost:${process.env.PORT}`;

    if (storageSettings.local.baseUrl) baseUrl = storageSettings.local.baseUrl;

    // Normalize and remove leading slashes if necessary
    const cleanPath = mediaIdOrPath.replace(/^\/+/, "");

    return `${baseUrl}/${cleanPath}`;
  }

  /**
   * Builds a tree structure of the local upload directory.
   */
  async getDirectoryStructure(): Promise<DirectoryNodeModel> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const basePath = value.local.uploadPath;

    const buildTree = async (
      currentPath: string
    ): Promise<DirectoryNodeModel> => {
      const { value } = await this.settingsService.findOne<CmsSettingsModel>(
        "core",
        CMS_SETTINGS_KEY
      );

      const baseUrl = value.apiUrl
        ? value.apiUrl
        : `http://localhost:${process.env.PORT}`;

      const relativePath = path.relative(basePath, currentPath);
      const node: DirectoryNodeModel = {
        name: path.basename(currentPath),
        path: relativePath ? "/" + relativePath.replace(/\\/g, "/") : "/",
        type: "directory",
        children: [],
      };

      let items: string[];
      try {
        items = await fs.promises.readdir(currentPath);
      } catch {
        throw new BadRequestException(
          `Error reading directory: ${currentPath}`
        );
      }

      for (const item of items) {
        if (item.startsWith(".")) continue;

        const itemPath = path.join(currentPath, item);
        const stats = await fs.promises.stat(itemPath);

        if (stats.isDirectory()) {
          node.children.push(await buildTree(itemPath));
        } else {
          const fileRelative = path.relative(basePath, itemPath);
          node.children.push({
            name: item,
            path: "/" + fileRelative.replace(/\\/g, "/"),
            type: "file",
            url: `${baseUrl}/public/${fileRelative.replace(/\\/g, "/")}`,
          });
        }
      }
      return node;
    };

    return buildTree(basePath);
  }

  /**
   * Creates an empty directory if it does not already exist.
   */
  async createEmptyDirectory(directoryPath: string): Promise<void> {
    try {
      const { value } =
        await this.settingsService.findOne<StorageSettingsModel>(
          "core",
          STORAGE_SETTINGS_KEY
        );

      const fullPath = value.local.uploadPath + directoryPath;
      if (!fs.existsSync(fullPath)) {
        await fs.promises.mkdir(fullPath, { recursive: true });
      }
    } catch {
      throw new BadRequestException("Error creating directory");
    }
  }

  /**
   * Deletes a file or directory from the filesystem.
   */
  async removeFile(filePath: string): Promise<void> {
    try {
      const { value } =
        await this.settingsService.findOne<StorageSettingsModel>(
          "core",
          STORAGE_SETTINGS_KEY
        );
      const fullPath = path.join(value.local.uploadPath, filePath);

      if (!fs.existsSync(fullPath)) {
        throw new BadRequestException("File not found");
      }

      const stats = await fs.promises.stat(fullPath);
      if (stats.isDirectory()) {
        await fs.promises.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(fullPath);
      }
    } catch {
      throw new BadRequestException("Error removing file/directory");
    }
  }

  /**
   * Renames a file or directory.
   */
  async renamePath(oldPath: string, newPath: string): Promise<void> {
    try {
      const { value } =
        await this.settingsService.findOne<StorageSettingsModel>(
          "core",
          STORAGE_SETTINGS_KEY
        );

      await fs.promises.rename(
        value.local.uploadPath + oldPath,
        value.local.uploadPath + newPath
      );
    } catch {
      throw new BadRequestException("Error renaming the path");
    }
  }

  /**
   * Moves a file or directory to a new location.
   */
  async movePath(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      const { value } =
        await this.settingsService.findOne<StorageSettingsModel>(
          "core",
          STORAGE_SETTINGS_KEY
        );
      const basePath = value.local.uploadPath;

      const sourceFullPath = path.join(basePath, sourcePath);
      const destinationFullPath = path.join(basePath, destinationPath);

      const destinationDir = path.dirname(destinationFullPath);
      if (!fs.existsSync(destinationDir)) {
        await fs.promises.mkdir(destinationDir, { recursive: true });
      }

      await fs.promises.rename(sourceFullPath, destinationFullPath);
    } catch {
      throw new BadRequestException("Error moving the path");
    }
  }

  /**
   * Copies a file or directory to a new location.
   */
  async copyPath(sourcePath: string, destinationPath: string): Promise<void> {
    try {
      const { value } =
        await this.settingsService.findOne<StorageSettingsModel>(
          "core",
          STORAGE_SETTINGS_KEY
        );
      const stats = await fs.promises.stat(value.local.uploadPath + sourcePath);

      if (stats.isDirectory()) {
        await this.copyDirectory(
          value.local.uploadPath + sourcePath,
          value.local.uploadPath + destinationPath
        );
      } else {
        const destinationDir = path.dirname(
          value.local.uploadPath + destinationPath
        );
        if (!fs.existsSync(destinationDir)) {
          await fs.promises.mkdir(destinationDir, { recursive: true });
        }
        await fs.promises.copyFile(
          value.local.uploadPath + sourcePath,
          value.local.uploadPath + destinationPath
        );
      }
    } catch {
      throw new BadRequestException("Error copying the path");
    }
  }

  /**
   * Helper to recursively copy a directory.
   */
  private async copyDirectory(
    sourceDir: string,
    destinationDir: string
  ): Promise<void> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );

    await fs.promises.mkdir(value.local.uploadPath + destinationDir, {
      recursive: true,
    });

    const entries = await fs.promises.readdir(sourceDir, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const srcPath = path.join(value.local.uploadPath + sourceDir, entry.name);
      const destPath = path.join(
        value.local.uploadPath + destinationDir,
        entry.name
      );

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  }
}
