import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import { Injectable, BadRequestException } from "@nestjs/common";
import { IStorageProvider } from "../storage-provider.interface";
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
   * Lazily initializes the S3 client from the SettingsService.
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

  /**
   * Uploads a file to S3.
   * Automatically handles public/private bucket configuration.
   * If the bucket is private or undefined, it generates a signed URL with a default TTL of 4h.
   */
  async uploadFile(
    file: Express.Multer.File,
    dir?: string
  ): Promise<Omit<UploadResultModel, "assetId">> {
    const s3 = await this.getS3Client();

    const settings = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const s3Settings = settings.value.s3;

    const isPublic = s3Settings?.isPublic ?? false;
    const signedUrlExpiration = s3Settings?.signedUrlExpiration ?? 14400; // default 4h

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

    const fileUrl = await this.resolveFileUrl(
      key,
      isPublic,
      signedUrlExpiration,
      s3Settings
    );

    return {
      filename: key,
      path: `s3://${this.bucket}/${key}`,
      url: fileUrl,
    };
  }

  /**
   * Returns a valid file URL based on bucket visibility.
   * - Public bucket → direct URL
   * - Private bucket → signed URL with defined TTL
   */
  private async resolveFileUrl(
    key: string,
    isPublic: boolean,
    signedUrlExpiration: number,
    s3Settings: any
  ): Promise<string> {
    const s3 = await this.getS3Client();

    if (isPublic) {
      const endpoint = s3Settings.endpoint?.replace(/\/$/, "");
      const forcePathStyle = s3Settings.forcePathStyle ?? false;

      if (endpoint) {
        return forcePathStyle
          ? `${endpoint}/${this.bucket}/${key}`
          : `${this.bucket}.${endpoint}/${key}`;
      }

      return `https://${this.bucket}.s3.${s3Settings.region}.amazonaws.com/${key}`;
    }

    const getCommand = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(s3, getCommand, {
      expiresIn: signedUrlExpiration,
    });
  }

  /**
   * Retrieves a readable URL for a given media path or ID.
   * If the bucket is private, generates a temporary signed URL.
   */
  async getFileUrl(mediaIdOrPath: string): Promise<string> {
    const s3 = await this.getS3Client();

    const settings = await this.settingsService.findOne<StorageSettingsModel>(
      "core",
      STORAGE_SETTINGS_KEY
    );
    const s3Settings = settings.value.s3;

    const isPublic = s3Settings?.isPublic ?? false;
    const signedUrlExpiration = s3Settings?.signedUrlExpiration ?? 14400;

    const bucketPrefix = `s3://${this.bucket}/`;
    const key = mediaIdOrPath.startsWith(bucketPrefix)
      ? mediaIdOrPath.substring(bucketPrefix.length)
      : mediaIdOrPath;

    return this.resolveFileUrl(key, isPublic, signedUrlExpiration, s3Settings);
  }

  /**
   * Deletes a file from S3.
   */
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
    } catch {
      throw new BadRequestException("Error removing file from S3");
    }
  }

  /**
   * Retrieves the S3 directory structure starting from the root.
   */
  async getDirectoryStructure(): Promise<DirectoryNodeModel> {
    return this.getDirectoryStructureForPrefix("");
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
    } catch {
      throw new BadRequestException(
        `Error listing S3 directory structure for prefix: ${prefix}`
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
   * Creates an empty "directory" object in S3 (key ending with "/").
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
    } catch {
      throw new BadRequestException("Error creating directory on S3");
    }
  }

  /**
   * Renames a file or directory (copy + delete).
   */
  async renamePath(oldPath: string, newPath: string): Promise<void> {
    await this.copyPath(oldPath, newPath);
    await this.removeFile(oldPath);
  }

  /**
   * Moves a file or directory (copy + delete).
   */
  async movePath(sourcePath: string, destinationPath: string): Promise<void> {
    await this.renamePath(sourcePath, destinationPath);
  }

  /**
   * Copies a file or an entire directory recursively.
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
            : `${destinationPath}/`;
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
