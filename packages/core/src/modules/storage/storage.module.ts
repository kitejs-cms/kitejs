import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";
import { LocalStorageProvider } from "./providers/local-storage.provider";
import { S3StorageProvider } from "./providers/s3-storage.provider";
import { MongooseModule } from "@nestjs/mongoose";
import { Storage, StorageSchema } from "./storage.schema";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Storage.name, schema: StorageSchema }]),
    SettingsModule,
  ],
  controllers: [StorageController],
  providers: [StorageService, LocalStorageProvider, S3StorageProvider],
  exports: [StorageService],
})
export class StorageModule {}
