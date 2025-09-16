import { Module } from "@nestjs/common";
import { CommerceModule } from "./commerce";

@Module({
  imports: [CommerceModule],
})
export class CommercePluginModule {}
