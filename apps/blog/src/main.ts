import { AppModule } from "./app.module";
import { bootstrap } from "@kitejs-cms/core/index";
import { GalleryPlugin } from "@kitejs-cms/plugin-gallery-api/plugin.config";

bootstrap({ modules: [AppModule], plugins: [GalleryPlugin] });
