import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import {
  IStorageProvider,
  UploadResult,
  DirectoryNode,
  FileNode,
} from "../storage-provider.interface";
import { Injectable, BadRequestException } from "@nestjs/common";
import {
  SettingsService,
  STORAGE_SETTINGS_KEY,
  StorageSettingsModel,
} from "../../settings";

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
  ): Promise<UploadResult> {
    const s3 = await this.getS3Client();
    const keyPrefix = dir ? `${dir.replace(/\/$/, "")}/` : "";
    const key = `${keyPrefix}${file.fieldname}-${uuidv4()}${extname(file.originalname)}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    return {
      filename: key,
      path: `s3://${this.bucket}/${key}`,
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
  async getDirectoryStructure(): Promise<DirectoryNode> {
    const rootPrefix = "";
    return this.getDirectoryStructureForPrefix(rootPrefix);
  }

  private async getDirectoryStructureForPrefix(
    prefix: string
  ): Promise<DirectoryNode> {
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

    const node: DirectoryNode = {
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
          } as FileNode);
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
}
