import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  Matches,
  ValidateIf,
} from "class-validator";
import { Type } from "class-transformer";
import type {
  BreakpointSettingsModel,
  GalleryLayout,
  GalleryMode,
  GallerySettingsModel,
  ResponsiveGallerySettingsModel,
} from "../models/gallery-settings.model";

export class BreakpointSettingsDto implements BreakpointSettingsModel {
  @ApiPropertyOptional({ example: 4, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  columns: number;

  @ApiPropertyOptional({ example: 16, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gap: number;

  constructor(partial: Partial<BreakpointSettingsDto>) {
    Object.assign(this, partial);
  }
}

export class ResponsiveRulesDto implements ResponsiveGallerySettingsModel {
  @ApiPropertyOptional({ type: () => BreakpointSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BreakpointSettingsDto)
  desktop: BreakpointSettingsDto;

  @ApiPropertyOptional({ type: () => BreakpointSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BreakpointSettingsDto)
  tablet: BreakpointSettingsDto;

  @ApiPropertyOptional({ type: () => BreakpointSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BreakpointSettingsDto)
  mobile: BreakpointSettingsDto;

  constructor(partial: Partial<ResponsiveRulesDto>) {
    Object.assign(this, partial);
  }
}

export class GallerySettingsDto implements GallerySettingsModel {
  @ApiPropertyOptional({ enum: ["grid", "masonry", "slider"], default: "grid" })
  @IsOptional()
  @IsIn(["grid", "masonry", "slider"])
  layout: GalleryLayout;

  @ApiPropertyOptional({
    enum: ["responsive", "manual"],
    default: "responsive",
  })
  @IsOptional()
  @IsIn(["responsive", "manual"])
  mode: GalleryMode;

  @ApiPropertyOptional({ type: () => ResponsiveRulesDto })
  @ValidateIf((o) => o.mode === "responsive" || o.responsive !== undefined)
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponsiveRulesDto)
  responsive?: ResponsiveRulesDto;

  @ApiPropertyOptional({ type: () => BreakpointSettingsDto })
  @ValidateIf((o) => o.mode === "manual" || o.manual !== undefined)
  @IsOptional()
  @ValidateNested()
  @Type(() => BreakpointSettingsDto)
  manual?: BreakpointSettingsDto;

  @ApiPropertyOptional({
    example: "auto",
    description: `"auto" or "W:H" like "16:9"`,
  })
  @IsOptional()
  @IsString()
  @Matches(/^(auto|\d+:\d+)$/)
  ratio: string;

  constructor(partial: Partial<GallerySettingsDto>) {
    Object.assign(this, partial);
  }
}
