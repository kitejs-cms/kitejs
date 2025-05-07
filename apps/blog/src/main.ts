import { AppModule } from "./app.module";
import { bootstrap } from "@kitejs-cms/core/index";
import BlogPlugin from "@kitejs-cms/blog-plugin/plugin.config";

bootstrap({ modules: [AppModule], plugins: [BlogPlugin] });
