import { Logger } from "@nestjs/common";
import { connection } from "mongoose";
import { PluginMigration } from "@kitejs-cms/core";
import { ANALYTICS_PLUGIN_NAMESPACE } from "../constants";

const logger = new Logger("AnalyticsPluginMigration");

const collectionName = `plugin-${ANALYTICS_PLUGIN_NAMESPACE}_events`;

const indexDefinitions = [
  { key: { createdAt: -1 }, name: "analytics_events_createdAt_desc" },
  { key: { type: 1, createdAt: -1 }, name: "analytics_events_type_createdAt" },
  {
    key: { identifier: 1, createdAt: -1 },
    name: "analytics_events_identifier_createdAt",
  },
  {
    key: { fingerprint: 1, createdAt: -1 },
    name: "analytics_events_fingerprint_createdAt",
  },
] as const;

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
      "MongoDB connection is not ready while running analytics migration."
    );
  }
  return db.collection(collectionName);
}

export const analyticsIndexesMigration: PluginMigration = {
  version: "0.0.1-alpha.0",
  async up() {
    const collection = await getCollection();
    for (const { key, name } of indexDefinitions) {
      try {
        await collection.createIndex(key, { name, background: true });
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
          await collection.createIndex(key, { name, background: true });
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
