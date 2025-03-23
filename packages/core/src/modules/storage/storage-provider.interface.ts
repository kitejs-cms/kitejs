export interface IStorageProvider {
  /**
   * Uploads a file to a specific directory.
   * @param file - The file to upload.
   * @param dir - Optional subdirectory where the file will be saved.
   * @returns A promise that resolves with the upload result.
   */
  uploadFile(file: Express.Multer.File, dir?: string): Promise<UploadResult>;

  /**
   * Removes a file given its full path.
   * @param filePath - The full path of the file to remove.
   */
  removeFile(filePath: string): Promise<void>;

  /**
   * Retrieves the directory structure.
   * @returns A promise that resolves with a tree-like structure of directories and files.
   */
  getDirectoryStructure(): Promise<DirectoryNode>;

  /**
   * Creates an empty directory at the specified path.
   * If the directory already exists, no action is taken.
   * @param directoryPath - The path where the directory should be created.
   */
  createEmptyDirectory(directoryPath: string): Promise<void>;
}

export type UploadResult = {
  filename: string;
  path: string;
};

export interface DirectoryNode {
  name: string;
  path: string;
  type: "directory";
  children: Array<DirectoryNode | FileNode>;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file";
}
