import { Logger } from "@nestjs/common";
import { connection } from "mongoose";
import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { PluginMigration } from "@kitejs-cms/core";
import { GALLERY_COLLECTION_NAME } from "../constants";

const logger = new Logger("GalleryPluginMigration");

export const collectionName = GALLERY_COLLECTION_NAME;

type GalleryIndexDefinition = {
  key: IndexSpecification;
  name: string;
  options?: CreateIndexesOptions;
};

const indexDefinitions: GalleryIndexDefinition[] = [
  { key: { status: 1, updatedAt: -1 }, name: "gallery_status_updatedAt" },
  {
    key: { slug: 1 },
    name: "gallery_slug_unique",
    options: { unique: true, sparse: true },
  },
  { key: { "items.assetId": 1 }, name: "gallery_items_assetId" },
];

function getMongoErrorCodeName(error: unknown): string | undefined {
  if (typeof error === "object" && error && "codeName" in error) {
    return (error as { codeName?: string }).codeName;
  }
  return undefined;
}

async function getCollection() {
  const db = connection.db;
  if (!db) {
    throw new Error(
      "MongoDB connection is not ready while running gallery migration."
    );
  }
  return db.collection(collectionName);
}

export const galleryIndexesMigration: PluginMigration = {
  version: "0.0.1-alpha.0",
  async up() {
    const collection = await getCollection();
    for (const definition of indexDefinitions) {
      const { key, name, options } = definition;
      try {
        await collection.createIndex(key, {
          name,
          background: true,
          ...(options ?? {}),
        });
        logger.log(`Ensured index ${name} on ${collectionName}`);
      } catch (error) {
        const codeName = getMongoErrorCodeName(error);
        if (codeName === "NamespaceNotFound") {
          logger.warn(
            `Collection ${collectionName} not found. Skipping index creation.`
          );
          return;
        }
        if (codeName === "IndexOptionsConflict" || codeName === "IndexKeySpecsConflict") {
          logger.warn(`Rebuilding index ${name} on ${collectionName}`);
          try {
            await collection.dropIndex(name);
          } catch (dropError) {
            const dropCodeName = getMongoErrorCodeName(dropError);
            if (
              dropCodeName &&
              dropCodeName !== "IndexNotFound" &&
              dropCodeName !== "NamespaceNotFound"
            ) {
              throw dropError;
            }
          }
          await collection.createIndex(key, {
            name,
            background: true,
            ...(options ?? {}),
          });
          continue;
        }
        throw error;
      }
    }
  },
  async down() {
    const collection = await getCollection();
    for (const { name } of indexDefinitions) {
      try {
        await collection.dropIndex(name);
        logger.log(`Dropped index ${name} from ${collectionName}`);
      } catch (error) {
        const codeName = getMongoErrorCodeName(error);
        if (codeName === "IndexNotFound" || codeName === "NamespaceNotFound") {
          logger.warn(`Index ${name} not present on ${collectionName}, skipping.`);
          continue;
        }
        throw error;
      }
    }
  },
};
