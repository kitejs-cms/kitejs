import { AppModule } from "./app.module";
import { bootstrap } from "@kitejs-cms/core/index";
import { GalleryPlugin } from "@kitejs-cms/gallery-plugin/plugin.config";

bootstrap({ modules: [AppModule], plugins: [GalleryPlugin] });
