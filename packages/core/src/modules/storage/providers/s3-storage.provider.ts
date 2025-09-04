import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { IStorageProvider } from "../storage-provider.interface";
import { Injectable, BadRequestException } from "@nestjs/common";
import { UploadResultModel } from "../models/upload-result.model";
import { DirectoryNodeModel, FileNodeModel } from "../models/fs-node.model";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  SettingsService,
  STORAGE_SETTINGS_KEY,
  StorageSettingsModel,
} from "../../settings";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private s3: S3Client;
  private bucket: string;

  constructor(private readonly settingsService: SettingsService) {}

  /**
   * Lazy-load S3 client and configuration from SettingsService.
   */
  private async getS3Client(): Promise<S3Client> {
    if (!this.s3) {
      const settings = await this.settingsService.findOne<StorageSettingsModel>(
        "core",
        STORAGE_SETTINGS_KEY
      );
      const s3Settings = settings.value.s3;
      if (!s3Settings) {
        throw new BadRequestException("S3 settings not configured");
      }
      this.s3 = new S3Client({
        region: s3Settings.region,
        credentials: {
          accessKeyId: s3Settings.accessKeyId,
          secretAccessKey: s3Settings.secretAccessKey,
        },
        ...(s3Settings.endpoint
          ? {
              endpoint: s3Settings.endpoint,
              forcePathStyle: s3Settings.forcePathStyle || false,
            }
          : {}),
      });
      this.bucket = s3Settings.bucket;
    }
    return this.s3;
  }

  async uploadFile(
    file: Express.Multer.File,
    dir?: string
  ): Promise<Omit<UploadResultModel, "assetId">> {
    const s3 = await this.getS3Client();
    const keyPrefix = dir ? `${dir.replace(/\/$/, "")}/` : "";
    const key = `${keyPrefix}${file.fieldname}-${uuidv4()}${extname(
      file.originalname
    )}`;

    const putCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await s3.send(putCommand);

    const getCommand = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, getCommand, {
      expiresIn: 3600,
    });

    return {
      filename: key,
      path: `s3://${this.bucket}/${key}`,
      url: signedUrl,
    };
  }

  async removeFile(filePath: string): Promise<void> {
    const s3 = await this.getS3Client();
    let key = filePath;
    const bucketPrefix = `s3://${this.bucket}/`;
    if (filePath.startsWith(bucketPrefix)) {
      key = filePath.substring(bucketPrefix.length);
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await s3.send(command);
    } catch (error) {
      throw new BadRequestException("Error removing file from S3");
    }
  }

  /**
   * Retrieves the directory structure starting from the root (or a configured prefix).
   * If non viene passato un prefisso, viene utilizzata la root (stringa vuota).
   */
  async getDirectoryStructure(): Promise<DirectoryNodeModel> {
    const rootPrefix = "";
    return this.getDirectoryStructureForPrefix(rootPrefix);
  }

  private async getDirectoryStructureForPrefix(
    prefix: string
  ): Promise<DirectoryNodeModel> {
    const s3 = await this.getS3Client();
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      Delimiter: "/",
    });
    let response;
    try {
      response = await s3.send(command);
    } catch (error) {
      throw new BadRequestException(
        "Error listing S3 directory structure for prefix: " + prefix
      );
    }

    const node: DirectoryNodeModel = {
      name: prefix ? prefix.split("/").filter(Boolean).pop()! : this.bucket,
      path: prefix,
      type: "directory",
      children: [],
    };

    if (response.CommonPrefixes) {
      for (const cp of response.CommonPrefixes) {
        if (cp.Prefix) {
          const child = await this.getDirectoryStructureForPrefix(cp.Prefix);
          node.children.push(child);
        }
      }
    }

    if (response.Contents) {
      for (const content of response.Contents) {
        if (
          content.Key &&
          content.Key !== prefix &&
          !content.Key.endsWith("/")
        ) {
          node.children.push({
            name: content.Key.split("/").pop() || content.Key,
            path: content.Key,
            type: "file",
          } as FileNodeModel);
        }
      }
    }
    return node;
  }

  /**
   * Creates an empty "directory" on S3 by uploading an empty object with a key ending in "/".
   */
  async createEmptyDirectory(directoryPath: string): Promise<void> {
    const s3 = await this.getS3Client();
    if (!directoryPath.endsWith("/")) {
      directoryPath += "/";
    }
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: directoryPath,
        Body: "",
      });
      await s3.send(command);
    } catch (error) {
      throw new BadRequestException("Error creating directory on S3");
    }
  }

  /**
   * Rinomina un file o una directory su S3.
   * Per S3, questa operazione si traduce in una copia seguita dall'eliminazione dell'elemento originale.
   * @param oldPath - Il percorso attuale (chiave S3) dell'elemento.
   * @param newPath - Il nuovo percorso (chiave S3) desiderato.
   */
  async renamePath(oldPath: string, newPath: string): Promise<void> {
    // Effettua la copia
    await this.copyPath(oldPath, newPath);
    // Elimina l'elemento originale
    await this.removeFile(oldPath);
  }

  /**
   * Sposta un file o una directory su S3.
   * Su S3, lo spostamento è equivalente alla rinomina (copy + delete).
   * @param sourcePath - Il percorso sorgente (chiave S3) dell'elemento.
   * @param destinationPath - Il nuovo percorso (chiave S3) di destinazione.
   */
  async movePath(sourcePath: string, destinationPath: string): Promise<void> {
    // Per S3, spostare equivale a rinominare
    await this.renamePath(sourcePath, destinationPath);
  }

  /**
   * Copia un file o una directory su S3.
   * Se la sorgente è una directory (chiave che termina con "/"), effettua una copia ricorsiva di tutti gli oggetti contenuti.
   * Altrimenti, copia il singolo oggetto.
   * @param sourcePath - Il percorso sorgente (chiave S3) dell'elemento.
   * @param destinationPath - Il percorso (chiave S3) di destinazione.
   */
  async copyPath(sourcePath: string, destinationPath: string): Promise<void> {
    const s3 = await this.getS3Client();

    if (sourcePath.endsWith("/")) {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: sourcePath,
      });
      const response = await s3.send(listCommand);
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (!obj.Key) continue;
          const relativeKey = obj.Key.substring(sourcePath.length);
          const destDir = destinationPath.endsWith("/")
            ? destinationPath
            : destinationPath + "/";
          const destKey = destDir + relativeKey;
          const copyCommand = new CopyObjectCommand({
            Bucket: this.bucket,
            CopySource: `${this.bucket}/${obj.Key}`,
            Key: destKey,
          });
          await s3.send(copyCommand);
        }
      }
    } else {
      const copyCommand = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourcePath}`,
        Key: destinationPath,
      });
      await s3.send(copyCommand);
    }
  }
}
