import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString } from "class-validator";

export class GallerySettingsDto {
  @ApiPropertyOptional({ enum: ["grid", "masonry", "slider"] })
  @IsOptional()
  @IsIn(["grid", "masonry", "slider"])
  layout?: "grid" | "masonry" | "slider";

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  columns?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  gap?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ratio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoplay?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  loop?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lightbox?: boolean;
}
