/**
 * Represents the shape of the metadata update input
 * used to modify SEO-related and file information for stored assets.
 */
export type UpdateStorageMetadata = {
  /** Alternative text for accessibility and SEO (supports multiple languages) */
  alt?: string;

  /** Title text shown as tooltip in browsers (supports multiple languages) */
  title?: string;

  /** Extended description for SEO or Open Graph (supports multiple languages) */
  description?: string;

  /** MIME type of the file (e.g., image/jpeg) */
  mediaType?: string;

  /** File size in bytes */
  size?: number;

  /** Absolute or signed URL of the media file */
  url?: string;
};
