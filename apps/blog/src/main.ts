import { AppModule } from "./app.module";
import { bootstrap } from "@kitejs-cms/core/index";
import { GalleryPlugin } from "@kitejs-cms/plugin-gallery-api";
import { AnalyticsPlugin } from "@kitejs-cms/plugin-analytics-api";

bootstrap({ modules: [AppModule], plugins: [GalleryPlugin, AnalyticsPlugin] });
