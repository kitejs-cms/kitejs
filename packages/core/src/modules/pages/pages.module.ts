import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Page, PageSchema } from "./schemas/page.schema";
import {
  PageRevision,
  PageRevisionSchema,
} from "./schemas/page-revision.schema";

import { CacheModule } from "../cache/cache.module";
import { PagesService } from "./services/pages.service";
import { PageRevisionsService } from "./services/page-revisions.service";
import { PagesController } from "./pages.controller";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Page.name, schema: PageSchema },
      { name: PageRevision.name, schema: PageRevisionSchema },
    ]),
    CacheModule,
  ],
  controllers: [PagesController],
  providers: [PagesService, PageRevisionsService],
  exports: [PagesService, PageRevisionsService],
})
export class PagesModule {}
