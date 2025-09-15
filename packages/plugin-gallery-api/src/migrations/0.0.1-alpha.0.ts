import { Logger } from "@nestjs/common";
import { connection, Schema, type Model } from "mongoose";
import { PluginMigration } from "@kitejs-cms/core";
import { GALLERY_COLLECTION_NAME } from "../constants";

const logger = new Logger("GalleryPluginMigration");

export const collectionName = GALLERY_COLLECTION_NAME;

type IndexKeyDefinition = Record<string, 1 | -1>;

type GalleryIndexDefinition = {
  key: IndexKeyDefinition;
  name: string;
  options?: {
    sparse?: boolean;
    unique?: boolean;
  };
};

type MigrationDocument = Record<string, unknown>;

const MIGRATION_MODEL_NAME = "GalleryMigrationModel";

function getMigrationModel(): Model<MigrationDocument> {
  const existingModel = connection.models[MIGRATION_MODEL_NAME] as
    | Model<MigrationDocument>
    | undefined;

  if (existingModel) {
    return existingModel;
  }

  const schema = new Schema<MigrationDocument>({}, {
    collection: collectionName,
    strict: false,
  });

  return connection.model<MigrationDocument>(
    MIGRATION_MODEL_NAME,
    schema,
    collectionName,
  );
}

async function ensureConnectionReady() {
  if (connection.readyState === 1) {
    return;
  }

  await connection.asPromise();

  if (connection.readyState !== 1) {
    throw new Error(
      "Mongoose connection is not ready while running gallery migration.",
    );
  }
}

async function getCollection() {
  await ensureConnectionReady();
  const model = getMigrationModel();
  return model.collection;
}

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
