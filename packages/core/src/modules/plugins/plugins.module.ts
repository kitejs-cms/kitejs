import { Module } from '@nestjs/common';
import { PluginsService } from './services/plugins.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PluginSchema, Plugin } from './plugin.schema';
import { PluginsController } from './plugins.controller';
import { PluginsLoaderService } from './services/plugins-loader.service';
import { SettingsModule } from '../settings';
import { UsersModule } from '../users';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Plugin.name, schema: PluginSchema }]),
    SettingsModule,
    UsersModule,
  ],
  controllers: [PluginsController],
  providers: [PluginsService, PluginsLoaderService],
  exports: [PluginsService, PluginsLoaderService],
})
export class PluginsModule {}
