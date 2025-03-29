import { Injectable, BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { IStorageProvider } from "../storage-provider.interface";
import {
  SettingsService,
  STORAGE_SETTINGS_KEY,
  StorageSettingsModel,
} from "../../settings";
import { UploadResultModel } from "../models/upload-result.model";
import { DirectoryNodeModel } from "../models/fs-node.model";

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Crea la directory di destinazione per il salvataggio dei file.
   * Se la directory non esiste, viene creata in modo ricorsivo.
   */
  private createDirectory(destination: string): string {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    return destination;
  }

  /**
   * Genera un nome file unico nella directory di destinazione.
   * Se il nome originale esiste già, viene aggiunto un suffisso numerico incrementale.
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

  async uploadFile(
    file: Express.Multer.File,
    dir?: string
  ): Promise<UploadResultModel> {
    if (!file) {
      throw new BadRequestException("Missing file");
    }

    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );

    const baseUploadPath = value.local.uploadPath;
    const uploadDirectory = this.createDirectory(baseUploadPath);

    let destinationDir = dir
      ? path.join(uploadDirectory, dir)
      : uploadDirectory;
    destinationDir = this.createDirectory(destinationDir);

    const fileName = this.generateFileName(file.originalname, destinationDir);

    const finalPath = path.join(destinationDir, fileName);

    try {
      await fs.promises.writeFile(finalPath, file.buffer);
    } catch (error) {
      throw new BadRequestException("Error saving file to filesystem");
    }

    return {
      filename: fileName,
      path: finalPath,
    };
  }

  async getDirectoryStructure(): Promise<DirectoryNodeModel> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const basePath = value.local.uploadPath;

    const buildTree = async (
      currentPath: string
    ): Promise<DirectoryNodeModel> => {
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
      } catch (error) {
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
          });
        }
      }
      return node;
    };

    return buildTree(basePath);
  }

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
    } catch (error) {
      throw new BadRequestException("Error creating directory");
    }
  }

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
    } catch (error) {
      throw new BadRequestException(
        "Error removing file/directory from filesystem"
      );
    }
  }

  /**
   * Renames a file or directory.
   * @param oldPath - The current path of the item.
   * @param newPath - The desired new path.
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
    } catch (error) {
      throw new BadRequestException("Error renaming the path");
    }
  }

  /**
   * Moves a file or directory to a new location.
   * @param sourcePath - The current path of the item.
   * @param destinationPath - The new destination path for the item.
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
    } catch (error) {
      console.log(error);
      throw new BadRequestException("Error moving the path", error);
    }
  }

  /**
   * Copies a file or directory to a new location.
   * @param sourcePath - The current path of the item.
   * @param destinationPath - The destination path for the copy.
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
          destinationPath
        );
      }
    } catch (error) {
      throw new BadRequestException("Errore nella copia del percorso");
    }
  }

  /**
   * Private function to recursively copy a directory.
   * @param sourceDir - The source directory to copy.
   * @param destinationDir - The destination directory.
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
