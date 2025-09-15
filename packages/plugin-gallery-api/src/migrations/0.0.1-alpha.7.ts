import { Logger } from "@nestjs/common";
import { connection, ConnectionStates } from "mongoose";

import { PluginMigration } from "@kitejs-cms/core";

import { GALLERY_COLLECTION_NAME } from "../constants";
import { galleryIndexesMigration } from "./0.0.1-alpha.0";

const logger = new Logger("GalleryRenameCollectionMigration");

const LEGACY_COLLECTION_NAME = "gallery-plugin_galleries";

const CONNECTED_STATE = ConnectionStates.connected;

async function ensureConnectionReady() {
  if (connection.readyState === CONNECTED_STATE) {
    return;
  }

  await connection.asPromise();

  if (connection.readyState !== CONNECTED_STATE) {
    throw new Error(
      "Mongoose connection is not ready while running gallery rename migration.",
    );
  }
}

async function collectionExists(name: string) {
  await ensureConnectionReady();
  const db = connection.db;
  if (!db) {
    throw new Error(
      "Mongoose connection is not available while checking gallery collections.",
    );
  }

  const collections = await db.listCollections({ name }).toArray();
  return collections.length > 0;
}

export const galleryRenameCollectionMigration: PluginMigration = {
  version: "0.0.1-alpha.7",
  async up() {
    await ensureConnectionReady();
    const legacyExists = await collectionExists(LEGACY_COLLECTION_NAME);

    if (legacyExists) {
      const targetExists = await collectionExists(GALLERY_COLLECTION_NAME);
      if (targetExists) {
        logger.warn(
          `Target collection ${GALLERY_COLLECTION_NAME} already exists. Skipping rename from ${LEGACY_COLLECTION_NAME}.`
        );
      } else {
        await connection
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
    await ensureConnectionReady();
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

    await connection
      .collection(GALLERY_COLLECTION_NAME)
      .rename(LEGACY_COLLECTION_NAME, { dropTarget: false });
    logger.log(
      `Renamed collection ${GALLERY_COLLECTION_NAME} back to ${LEGACY_COLLECTION_NAME}.`
    );
  },
};
