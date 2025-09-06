import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class UserConsentUpdateDto {
  @ApiProperty({ description: "Type of consent", example: "terms" })
  @IsString()
  consentType: string;

  @ApiProperty({ description: "Whether the user has given consent", example: true })
  @IsBoolean()
  given: boolean;
}

export class UpdateUserConsentsDto {
  @ApiProperty({ type: [UserConsentUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserConsentUpdateDto)
  consents: UserConsentUpdateDto[];
}

