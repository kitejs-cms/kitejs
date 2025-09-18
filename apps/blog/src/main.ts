import { AppModule } from "./app.module";
import { bootstrap } from "@kitejs-cms/core/index";
import { GalleryPlugin } from "@kitejs-cms/plugin-gallery-api";
import { AnalyticsPlugin } from "@kitejs-cms/plugin-analytics-api";
import { CommercePlugin } from "@kitejs-cms/plugin-commerce-api";

bootstrap({
  modules: [AppModule],
  plugins: [GalleryPlugin, AnalyticsPlugin, CommercePlugin],
});
