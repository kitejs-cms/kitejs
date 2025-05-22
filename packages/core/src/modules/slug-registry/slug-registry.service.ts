import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { SlugRegistry } from "./slug-registry.schema";

@Injectable()
export class SlugRegistryService {
  constructor(
    @InjectModel(SlugRegistry.name)
    private readonly slugRegistryModel: Model<SlugRegistry>
  ) { }

  /**
   * Registers a new slug in the system
   * @param slug - The slug to register
   * @param namespace - The namespace for the slug (e.g., 'pages', 'products')
   * @param entityId - The associated entity ID
   * @param language - Optional language code for multilingual slugs
   * @throws Error if slug already exists for the namespace/language combination
   */
  async registerSlug(
    slug: string,
    namespace: string,
    entityId: Types.ObjectId,
    language?: string
  ): Promise<void> {
    const filter = { slug, namespace, language };
    const update = { $set: { entityId } };
    const options = { upsert: true, new: true };

    const existing = await this.slugRegistryModel.findOne(filter);

    if (existing && !existing.entityId.equals(entityId)) {
      throw new Error(
        `Slug '${slug}' already exists in namespace '${namespace}'${language ? ` for language '${language}'` : ""}`
      );
    }

    await this.slugRegistryModel.findOneAndUpdate(filter, update, options);
  }

  /**
   * Finds an entity by its slug
   * @param slug - The slug to search for
   * @param namespace - The namespace to search within
   * @param language - Optional language code filter
   * @returns The associated entity ID or null if not found
   */
  async findEntityBySlug(
    slug: string,
    namespace: string,
    language?: string
  ): Promise<Types.ObjectId | null> {
    const query: Record<string, any> = {
      slug,
      namespace,
    };

    if (language) {
      query.language = language;
    }

    const record = await this.slugRegistryModel.findOne(query);
    return record?.entityId || null;
  }

  /**
   * Removes a slug from the registry
   * @param slug - The slug to remove
   * @param namespace - The namespace of the slug
   * @param language - Optional language code
   */
  async deleteSlug(
    slug: string,
    namespace: string,
    language?: string
  ): Promise<void> {
    await this.slugRegistryModel.deleteMany({ slug, namespace, language });
  }

  /**
   * Checks slug availability and suggests alternatives
   * @param slug - The slug to check
   * @param namespace - The namespace to check within
   * @param language - Optional language code
   * @param maxAttempts - Maximum number of alternatives to generate (default: 5)
   * @returns Object containing availability status and suggested alternatives
   */
  async checkSlugAvailability(
    slug: string,
    namespace: string,
    language?: string,
    maxAttempts: number = 5
  ): Promise<{
    exists: boolean;
    originalSlug: string;
    alternatives: string[];
  }> {
    const exists = await this.slugRegistryModel.exists({
      slug,
      namespace,
      language,
    });

    if (!exists) {
      return {
        exists: false,
        originalSlug: slug,
        alternatives: [],
      };
    }

    const alternatives: string[] = [];
    let attempt = 1;

    while (alternatives.length < maxAttempts) {
      const newSlug = `${slug}-${attempt}`;
      const alternativeExists = await this.slugRegistryModel.exists({
        slug: newSlug,
        namespace,
        language,
      });

      if (!alternativeExists) {
        alternatives.push(newSlug);
      }

      attempt++;
      if (attempt > maxAttempts * 2) break; // Prevent infinite loops
    }

    return {
      exists: true,
      originalSlug: slug,
      alternatives,
    };
  }

  /**
   * Generates a unique slug based on a base string
   * @param baseSlug - The desired slug to start with
   * @param namespace - The namespace for the slug
   * @param language - Optional language code
   * @returns A guaranteed unique slug (either the original or a modified version)
   */
  async generateUniqueSlug(
    baseSlug: string,
    namespace: string,
    language?: string
  ): Promise<string> {
    const { exists, originalSlug, alternatives } =
      await this.checkSlugAvailability(baseSlug, namespace, language);

    if (!exists) {
      return originalSlug;
    }

    if (alternatives.length > 0) {
      return alternatives[0];
    }

    // Fallback to random hash if no alternatives available
    const uniqueHash = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${uniqueHash}`;
  }

  /**
   * Finds all slugs associated with an entity
   * @param entityId - The entity ID to search for
   * @returns Array of all slugs registered for this entity
   */
  async findSlugsByEntity(entityId: Types.ObjectId) {
    const records = await this.slugRegistryModel.find<SlugRegistry>({
      entityId,
    });

    return records;
  }
}
