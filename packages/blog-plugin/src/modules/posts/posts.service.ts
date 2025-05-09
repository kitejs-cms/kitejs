import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { BLOG_NAMESPACE } from "../../constants";
import { Post } from "./posts.schema";
import { ObjectIdUtils, SlugRegistryService } from "@kitejs-cms/core/index";
import { JwtPayloadModel } from "@kitejs-cms/core/modules/auth/models/payload-jwt.model";
import { User } from "@kitejs-cms/core/modules/users/schemas/user.schema";
import { PostUpsertDto } from "./dto/post-upsert.dto";
import { PostResponseDetailsModel } from "./models/post-response-details.model";
import { PostResponseDto } from "./dto/post-response.dto";
import { PostTranslationModel } from "./models/post-translation.model";
import { Category } from "modules/categories";

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private readonly slugNamespace = `${BLOG_NAMESPACE}:posts`;

  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<Post>,
    private readonly slugService: SlugRegistryService
  ) {}

  /**
   * Counts the total number of posts (optional: you can pass filters in the future).
   * @returns Total number of posts.
   * @throws BadRequestException if an error occurs.
   */
  async countPosts(): Promise<number> {
    try {
      return await this.postModel.countDocuments().exec();
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to count posts. ${errorMessage}`);
    }
  }

  /**
   * Creates or updates a post.
   * @param postData Data for the new or updated post.
   * @param user Authenticated user.
   * @returns The created or updated post.
   * @throws BadRequestException if the post cannot be created or updated.
   */
  async upsertPost(
    postData: PostUpsertDto,
    user: JwtPayloadModel
  ): Promise<PostResponseDetailsModel> {
    try {
      const { id, language, ...restData } = postData;
      const postBaseData = {
        status: restData.status,
        tags: restData.tags,
        publishAt: restData.publishAt,
        expireAt: restData.expireAt,
        updatedBy: user.sub,
        categories: restData.categories,
        coverImage: restData.coverImage,
      };

      const translationData = {
        title: restData.title,
        description: restData.description,
        slug: restData.slug,
        blocks: restData.blocks,
        seo: restData.seo,
      };

      let post: Post;

      if (id) {
        post = await this.postModel.findByIdAndUpdate(
          id,
          {
            ...postBaseData,
            $set: { [`translations.${language}`]: translationData },
          },
          { new: true, upsert: false }
        );

        if (!post) {
          throw new NotFoundException(`Post with ID ${id} not found`);
        }

        await this.slugService.registerSlug(
          restData.slug,
          this.slugNamespace,
          ObjectIdUtils.toObjectId(post.id),
          language
        );
      } else {
        post = await this.postModel.create({
          ...postBaseData,
          createdBy: user.sub,
          translations: {
            [language]: translationData,
          },
        });

        await this.slugService.registerSlug(
          restData.slug,
          this.slugNamespace,
          ObjectIdUtils.toObjectId(post.id),
          language
        );
      }

      return this.findPostById(post._id.toString());
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to upsert post: ${errorMessage}`);
    }
  }

  /**
   * Retrieves a post by its unique identifier (slug or _id).
   * @param identify The unique identifier (slug or _id).
   * @returns The full post document, or null if not found.
   * @throws BadRequestException if the query fails.
   */
  async findPost(identify: string): Promise<Post | null> {
    try {
      let post: Post | null;

      if (Types.ObjectId.isValid(identify)) {
        post = await this.postModel.findById(identify).exec();
      } else {
        const slugEntry = await this.slugService.findEntityBySlug(
          identify,
          this.slugNamespace
        );

        if (!slugEntry) {
          throw new NotFoundException(`No post found for slug: ${identify}`);
        }

        post = await this.postModel.findById(slugEntry).exec();
      }

      return post;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch post. ${errorMessage}`);
    }
  }

  /**
   * Retrieves a single post for frontend consumption with a single translation.
   * @param identify The unique identifier (slug or _id).
   * @param language The desired language code (e.g., 'en', 'it').
   * @param fallbackLanguage Optional fallback language if the requested language is missing.
   * @returns A PostResponseDto containing post core properties and the selected translation.
   * @throws NotFoundException if the post or translation is not found.
   */
  async findPostForWeb(
    identify: string,
    language: string,
    fallbackLanguage?: string
  ): Promise<PostResponseDto> {
    const post = await this.findPost(identify);
    if (!post) {
      throw new NotFoundException(`Post not found for identifier: ${identify}`);
    }

    const postData = post.toJSON();
    const translations = postData.translations as Record<
      string,
      PostTranslationModel
    >;

    let selectedTranslation = translations[language];

    if (!selectedTranslation && fallbackLanguage) {
      selectedTranslation = translations[fallbackLanguage];
    }

    if (!selectedTranslation) {
      throw new NotFoundException(
        `Translation not found for language: ${language}` +
          (fallbackLanguage ? ` and fallback: ${fallbackLanguage}` : "")
      );
    }

    return {
      slug: postData.slug,
      status: postData.status,
      tags: postData.tags,
      publishAt: postData.publishAt,
      title: selectedTranslation.title,
      description: selectedTranslation.description,
      blocks: selectedTranslation.blocks,
      seo: selectedTranslation.seo,
      language: language,
      categories: postData.categories,
      coverImage: postData.coverImage,
    };
  }

  /**
   * Retrieves a single post with detailed response model.
   * @param id The post ID.
   * @returns The post with response details.
   * @throws NotFoundException if not found.
   */
  async findPostById(id: string): Promise<PostResponseDetailsModel> {
    try {
      const post = await this.postModel
        .findById(id)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .populate<{ categories: Category[] }>("categories")
        .exec();

      if (!post) {
        throw new NotFoundException(`Post with ID "${id}" not found.`);
      }

      const slugs = await this.slugService.findSlugsByEntity(
        new Types.ObjectId(id)
      );

      const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
        acc[cur.language] = cur.slug;
        return acc;
      }, {});

      const json = post.toJSON();
      const translationsWithSlug: Record<string, PostTranslationModel> = {};
      for (const [lang, trans] of Object.entries(json.translations)) {
        translationsWithSlug[lang] = {
          ...(trans as unknown as PostTranslationModel),
          slug: slugMap[lang] ?? "",
        };
      }

      return {
        ...json,
        createdBy: `${post.createdBy.firstName} ${post.createdBy.lastName}`,
        updatedBy: `${post.updatedBy.firstName} ${post.updatedBy.lastName}`,
        translations: translationsWithSlug,
      } as unknown as PostResponseDetailsModel;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to fetch post by ID. ${errorMessage}`
      );
    }
  }

  /**
   * Retrieves a paginated list of posts.
   * @param pageNumber Page number (default: 1).
   * @param itemsPerPage Number of items per page (default: 10).
   * @returns An array of posts.
   * @throws BadRequestException if the query fails.
   */
  async findPosts(
    pageNumber = 1,
    itemsPerPage = 10
  ): Promise<PostResponseDetailsModel[]> {
    try {
      const skip = (pageNumber - 1) * itemsPerPage;
      const posts = await this.postModel
        .find()
        .skip(skip)
        .limit(itemsPerPage)
        .populate<{ createdBy: User }>("createdBy")
        .populate<{ updatedBy: User }>("updatedBy")
        .populate<{ categories: Category[] }>("categories")
        .exec();

      const postsRes: PostResponseDetailsModel[] = [];

      for (const item of posts) {
        const slugs = await this.slugService.findSlugsByEntity(item.id);

        const slugMap = slugs.reduce<Record<string, string>>((acc, cur) => {
          acc[cur.language] = cur.slug;
          return acc;
        }, {});

        const json = item.toJSON();
        const translationsWithSlug: Record<string, PostTranslationModel> = {};
        for (const [lang, trans] of Object.entries(json.translations)) {
          translationsWithSlug[lang] = {
            ...(trans as unknown as PostTranslationModel),
            slug: slugMap[lang] ?? "",
          };
        }

        postsRes.push({
          ...json,
          translations: translationsWithSlug,
          createdBy: `${item.createdBy.firstName} ${item.createdBy.lastName}`,
          updatedBy: `${item.updatedBy.firstName} ${item.updatedBy.lastName}`,
        } as unknown as PostResponseDetailsModel);
      }

      return postsRes;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to fetch posts. ${errorMessage}`);
    }
  }

  /**
   * Deletes an existing post.
   * @param id The post ID.
   * @returns True if the post was deleted; false otherwise.
   * @throws BadRequestException if the deletion fails.
   */
  async deletePost(id: string): Promise<boolean> {
    try {
      const result = await this.postModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      this.logger.error(error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to delete post. ${errorMessage}`);
    }
  }
}
