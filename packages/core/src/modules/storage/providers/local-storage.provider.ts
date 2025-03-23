import { Injectable, BadRequestException } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import {
  DirectoryNode,
  IStorageProvider,
  UploadResult,
} from "../storage-provider.interface";
import {
  SettingsService,
  STORAGE_SETTINGS_KEY,
  StorageSettingsModel,
} from "../../settings";

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Creates the target directory for file storage.
   * If the directory doesn't exist, it is created recursively.
   */
  private createDirectory(destination: string): string {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }
    return destination;
  }

  /**
   * Generates a unique file name in the given destination directory.
   * If the original file name already exists, an incremental numeric suffix is appended.
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
   * Handles the file upload process:
   * - Reads configuration settings to determine the base upload path.
   * - Creates the directory (or subdirectory if provided) if it does not exist.
   * - Generates a unique file name based on the original name.
   * - Saves the file content (from file.buffer) to the filesystem.
   * - Returns the generated file name and the final full path.
   */
  async uploadFile(
    file: Express.Multer.File,
    dir?: string
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException("Missing file");
    }

    // Retrieve the storage configuration from settings.
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

  /**
   * Retrieves the directory structure starting from the root upload path defined in the configuration.
   * Returns a tree-like structure representing files and directories.
   * The "path" property for each node is relative to the base upload path.
   */
  async getDirectoryStructure(): Promise<DirectoryNode> {
    const { value } = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const basePath = value.local.uploadPath;

    // Funzione ricorsiva per costruire l'albero delle directory.
    const buildTree = async (currentPath: string): Promise<DirectoryNode> => {
      // Calcola il percorso relativo rispetto alla directory base.
      const relativePath = path.relative(basePath, currentPath);
      const node: DirectoryNode = {
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
        // Esclude file o directory nascosti (quelli che iniziano con un punto).
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
  /**
   * Creates an empty directory at the specified path.
   * If the directory already exists, no action is taken.
   */
  async createEmptyDirectory(directoryPath: string): Promise<void> {
    try {
      if (!fs.existsSync(directoryPath)) {
        await fs.promises.mkdir(directoryPath, { recursive: true });
      }
    } catch (error) {
      throw new BadRequestException("Error creating directory");
    }
  }

  /**
   * Removes a file from the filesystem given its full path.
   */
  async removeFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      } else {
        throw new BadRequestException("File not found");
      }
    } catch (error) {
      throw new BadRequestException("Error removing file from filesystem");
    }
  }
}
