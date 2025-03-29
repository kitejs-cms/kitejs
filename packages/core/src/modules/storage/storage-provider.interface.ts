import { DirectoryNodeModel } from "./models/fs-node.model";
import { UploadResultModel } from "./models/upload-result.model";

export interface IStorageProvider {
  /**
   * Uploads a file to a specific directory.
   * @param file - The file to upload.
   * @param dir - Optional subdirectory where the file will be saved.
   * @returns A promise that resolves with the upload result.
   */
  uploadFile(
    file: Express.Multer.File,
    dir?: string
  ): Promise<UploadResultModel>;

  /**
   * Removes a file given its full path.
   * @param filePath - The full path of the file to remove.
   */
  removeFile(filePath: string): Promise<void>;

  /**
   * Retrieves the directory structure.
   * @returns A promise that resolves with a tree-like structure of directories and files.
   */
  getDirectoryStructure(): Promise<DirectoryNodeModel>;

  /**
   * Creates an empty directory at the specified path.
   * If the directory already exists, no action is taken.
   * @param directoryPath - The path where the directory should be created.
   */
  createEmptyDirectory(directoryPath: string): Promise<void>;

  /**
   * Renames a file or directory
   * @param oldPath Current path of the item
   * @param newPath New path for the item
   */
  renamePath(oldPath: string, newPath: string): Promise<void>;

  /**
   * Moves a file or directory to a new location
   * @param sourcePath Current path of the item
   * @param destinationPath New path for the item
   */
  movePath(sourcePath: string, destinationPath: string): Promise<void>;

  /**
   * Copies a file or directory to a new location
   * @param sourcePath Current path of the item
   * @param destinationPath New path for the copy
   */
  copyPath(sourcePath: string, destinationPath: string): Promise<void>;
}
