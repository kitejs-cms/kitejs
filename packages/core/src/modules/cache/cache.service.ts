import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { InjectConnection } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Connection } from 'mongoose';
import {
  CACHE_SETTINGS_KEY,
  CacheSettingsModel,
} from '../settings/models/cache.model';
import {
  Inject,
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Setting } from '../settings/settings.schema';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectConnection() private readonly connection: Connection
  ) {
    if (!this.connection) {
      this.logger.error('Database connection is undefined!');
      throw new InternalServerErrorException(
        'Database connection is not available'
      );
    }
  }

  /**
   * Creates a cache key with a namespace.
   * Example: cacheService.createCacheKey("user", "123") => "user:123"
   */
  private createCacheKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  /**
   * Retrieves the cache configuration from the database.
   * If the configuration is already cached, it returns the cached version.
   * Throws an exception if the database connection fails.
   */
  private async getCacheConfig(): Promise<CacheSettingsModel> {
    try {
      let config = await this.cacheManager.get<CacheSettingsModel>(
        CACHE_SETTINGS_KEY
      );
      if (config) return config;

      if (!this.connection.db) {
        this.logger.error(
          'Database connection lost while fetching cache config.'
        );
        throw new InternalServerErrorException(
          'Failed to retrieve cache config: No DB connection.'
        );
      }

      // Fetch configuration from the database (specific to "core" namespace)
      const settingsCollection = this.connection.db.collection('settings');
      const dbConfig = await settingsCollection.findOne<
        Setting<CacheSettingsModel>
      >({
        key: CACHE_SETTINGS_KEY,
        namespace: 'core',
      });

      config = dbConfig?.value ?? { ttl: 0, enabled: false };

      // Cache the configuration only if caching is enabled
      if (config.enabled && config.ttl > 0) {
        await this.cacheManager.set(CACHE_SETTINGS_KEY, config, config.ttl);
        this.logger.log(
          `Cache Config Loaded from DB: ${JSON.stringify(config)}`
        );
      }

      return config;
    } catch (error) {
      this.logger.error('Error retrieving cache configuration from DB', error);
      throw new InternalServerErrorException(
        'Error retrieving cache configuration'
      );
    }
  }

  /**
   * Retrieves a cached value by namespace and key.
   * Returns `null` if the key is not found or caching is disabled.
   */
  async get<T>(namespace: string, key: string): Promise<T | null> {
    const config = await this.getCacheConfig();
    if (!config.enabled) return null;

    const cacheKey = this.createCacheKey(namespace, key);
    return (await this.cacheManager.get<T>(cacheKey)) ?? null;
  }

  /**
   * Stores a value in the cache with a namespace and TTL.
   * Uses the TTL from the database configuration if not provided.
   */
  async set<T>(
    namespace: string,
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    const config = await this.getCacheConfig();
    if (!config.enabled || !value) return;

    const cacheTTL = ttl ?? config.ttl;
    if (cacheTTL > 0) {
      const cacheKey = this.createCacheKey(namespace, key);
      await this.cacheManager.set(cacheKey, value, cacheTTL);
    }
  }

  /**
   * Deletes a cached value by namespace and key.
   */
  async del(namespace: string, key: string): Promise<void> {
    const cacheKey = this.createCacheKey(namespace, key);
    await this.cacheManager.del(cacheKey);
  }

  /**
   * Checks if a key exists in the cache (by namespace).
   */
  async has(namespace: string, key: string): Promise<boolean> {
    return (await this.get(namespace, key)) !== null;
  }
}
