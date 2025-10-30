/**
 * Represents the complete metadata of a stored file or directory,
 * including all translations for multilingual fields.
 * Used for administrative dashboards or backend tools.
 */

import { StorageItemType } from "./storage-response.model";

export type StorageResponseDetailsModel = {
  /** Unique identifier of the storage item when persisted. */
  id?: string;

  /** Name of the file or directory */
  name: string;

  /** Full path of the item */
  path: string;

  /** Item type: "file" or "directory" */
  type: StorageItemType;

  /** URL to access the file (only for files) */
  url?: string;

  /** All localized alt texts for accessibility and SEO */
  alt?: Record<string, string>;

  /** All localized titles (shown as tooltip in browsers, SEO context) */
  title?: Record<string, string>;

  /** All localized descriptions (for SEO and OpenGraph metadata) */
  description?: Record<string, string>;

  /** MIME type of the file (e.g. image/jpeg) */
  mediaType?: string;

  /** File size in bytes */
  size?: number;

  /** Optional width/height metadata (if applicable) */
  dimensions?: {
    width?: number;
    height?: number;
  };

  /** Creation date (ISO string or Date) */
  createdAt?: string;

  /** Last update date (ISO string or Date) */
  updatedAt?: string;

  /** Child items (only for directories) */
  children?: StorageResponseDetailsModel[];
};
