import { Logger } from "@nestjs/common";
import { connection } from "mongoose";

import { PluginMigration } from "@kitejs-cms/core";

import { GALLERY_COLLECTION_NAME } from "../constants";
import { galleryIndexesMigration } from "./0.0.1-alpha.0";

const logger = new Logger("GalleryRenameCollectionMigration");

const LEGACY_COLLECTION_NAME = "gallery-plugin_galleries";

function getMongoDatabase() {
  const db = connection.db;
  if (!db) {
    throw new Error(
      "MongoDB connection is not ready while running gallery rename migration."
    );
  }
  return db;
}

async function collectionExists(name: string) {
  const db = getMongoDatabase();
  const collections = await db.listCollections({ name }).toArray();
  return collections.length > 0;
}

export const galleryRenameCollectionMigration: PluginMigration = {
  version: "0.0.1-alpha.7",
  async up() {
    const db = getMongoDatabase();
    const legacyExists = await collectionExists(LEGACY_COLLECTION_NAME);

    if (legacyExists) {
      const targetExists = await collectionExists(GALLERY_COLLECTION_NAME);
      if (targetExists) {
        logger.warn(
          `Target collection ${GALLERY_COLLECTION_NAME} already exists. Skipping rename from ${LEGACY_COLLECTION_NAME}.`
        );
      } else {
        await db
          .collection(LEGACY_COLLECTION_NAME)
          .rename(GALLERY_COLLECTION_NAME, { dropTarget: false });
        logger.log(
          `Renamed collection ${LEGACY_COLLECTION_NAME} to ${GALLERY_COLLECTION_NAME}.`
        );
      }
    } else {
      logger.log(
        `Collection ${LEGACY_COLLECTION_NAME} not found. Ensuring indexes on ${GALLERY_COLLECTION_NAME}.`
      );
    }

    await galleryIndexesMigration.up();
  },
  async down() {
    const db = getMongoDatabase();
    const currentExists = await collectionExists(GALLERY_COLLECTION_NAME);

    if (!currentExists) {
      logger.warn(
        `Collection ${GALLERY_COLLECTION_NAME} does not exist. Nothing to rename back.`
      );
      return;
    }

    const legacyExists = await collectionExists(LEGACY_COLLECTION_NAME);
    if (legacyExists) {
      logger.warn(
        `Legacy collection ${LEGACY_COLLECTION_NAME} already exists. Skipping rename back from ${GALLERY_COLLECTION_NAME}.`
      );
      return;
    }

    await db
      .collection(GALLERY_COLLECTION_NAME)
      .rename(LEGACY_COLLECTION_NAME, { dropTarget: false });
    logger.log(
      `Renamed collection ${GALLERY_COLLECTION_NAME} back to ${LEGACY_COLLECTION_NAME}.`
    );
  },
};
