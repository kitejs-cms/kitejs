/**
 * Represents a file or directory item stored in the system.
 * Mirrors the structure of `StorageItemDto` but without NestJS/Swagger decorators.
 */
export type StorageItemType = "file" | "directory";

export type StorageResponseModel = {
  /** Name of the file or directory */
  name: string;

  /** Full path of the item */
  path: string;

  /** Item type: "file" or "directory" */
  type: StorageItemType;

  /** URL to access the file (only for files) */
  url?: string;

  /** Alt text for the file (SEO / accessibility, only for files) */
  alt?: string;

  /** Description of the file (SEO / OpenGraph metadata) */
  description?: string;

  /** Title of the file (shown as tooltip in browsers, SEO context) */
  title?: string;

  /** Child items (only for directories) */
  children?: StorageResponseModel[];
};
