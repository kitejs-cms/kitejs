import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheModule as PrimitiveCacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [PrimitiveCacheModule.register({})],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
