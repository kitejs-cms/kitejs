import { ApiProperty } from "@nestjs/swagger";
import { InitCmsModel } from "../models/init-cms.model";
import {
  IsString,
  IsEmail,
  IsUrl,
  IsBoolean,
  IsOptional,
  MinLength,
  Matches,
} from "class-validator";

export class InitCmsDto implements InitCmsModel {
  @ApiProperty({
    example: "admin@example.com",
    description: "Administrator's email",
  })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: "Admin", description: "Administrator's first name" })
  @IsString()
  adminFirstName: string;

  @ApiProperty({ example: "User", description: "Administrator's last name" })
  @IsString()
  adminLastName: string;

  @ApiProperty({
    example: "StrongPass123!",
    description: "Admin password for the CMS",
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long." })
  @Matches(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter.",
  })
  @Matches(/[a-z]/, {
    message: "Password must contain at least one lowercase letter.",
  })
  @Matches(/\d/, { message: "Password must contain at least one number." })
  @Matches(/[@$!%*?&]/, {
    message: "Password must contain at least one special character (@$!%*?&).",
  })
  adminPassword: string;

  @ApiProperty({ example: "My CMS", description: "Website name" })
  @IsString()
  siteName: string;

  @ApiProperty({ example: "https://example.com", description: "Website URL" })
  @IsUrl()
  siteUrl: string;

  @ApiProperty({
    example: "A modern and powerful CMS for content management.",
    description: "Website description for SEO",
    required: false,
  })
  @IsString()
  @IsOptional()
  siteDescription?: string;

  @ApiProperty({ example: "en", description: "Default language of the CMS" })
  @IsString()
  defaultLanguage: string;

  @ApiProperty({
    example: true,
    description: "Allow search engines to index the website",
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  allowIndexing?: boolean;

  constructor(partial: Partial<InitCmsDto>) {
    Object.assign(this, partial);
  }
}
