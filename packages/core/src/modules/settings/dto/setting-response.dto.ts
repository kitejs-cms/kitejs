import { ApiProperty } from "@nestjs/swagger";
import { Scope } from "../models/scope.enum";
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
} from "class-validator";

export class SettingResponseDto {
  @ApiProperty({
    description: "Namespace of the setting (e.g., plugin name).",
    example: "plugin-blog",
  })
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @ApiProperty({
    description: "Unique key for the setting within the namespace.",
    example: "itemsPerPage",
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: "Value of the setting.",
    example: { value: 10 },
  })
  @IsObject()
  @IsNotEmpty()
  value: any;

  @ApiProperty({
    description: "Scope of the setting (e.g., global, plugin, theme).",
    enum: Scope,
    example: Scope.PLUGIN,
  })
  @IsOptional()
  @IsEnum(Scope)
  scope?: Scope;

  constructor(partial: Partial<SettingResponseDto>) {
    Object.assign(this, partial);
  }
}
