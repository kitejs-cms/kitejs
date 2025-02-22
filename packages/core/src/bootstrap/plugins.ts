import { ConsoleLogger, Logger, Module, Type } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { IPlugin, PluginsModule } from "../modules/plugins";
import { DatabaseModule } from "../common";
import { PluginsLoaderService } from "../modules/plugins/services/plugins-loader.service";
import CorePlugin from "../plugin.config";

const logger = new Logger("PluginsSetup");

/**
 * Temporary NestJS module to initialize only the required dependencies.
 */
@Module({ imports: [DatabaseModule.register(), PluginsModule] })
class PluginsSetupModule {}

/**
 * Loads all enabled plugins dynamically and returns their modules.
 * - If plugins are passed as input, they are used directly.
 * - If no plugins are passed, it fetches enabled plugins from the database.
 * @param providedPlugins (Optional) List of plugin instances to load.
 * @returns An array of NestJS modules (Type<unknown>).
 */
export async function pluginsSetup(
  providedPlugins: IPlugin[]
): Promise<Type<unknown>[]> {
  const logger = new ConsoleLogger({ prefix: "KiteJs" });

  const appContext = await NestFactory.createApplicationContext(
    PluginsSetupModule,
    { logger }
  );

  try {
    const pluginService = appContext.get(PluginsLoaderService);

    await pluginService.loadPlugins([CorePlugin]);

    const pluginsModule = await pluginService.loadPlugins(providedPlugins);

    return pluginsModule;
  } catch (error) {
    logger.error(`❌ Error in plugins setup: ${error}`);
    return [];
  } finally {
    await appContext.close();
  }
}
