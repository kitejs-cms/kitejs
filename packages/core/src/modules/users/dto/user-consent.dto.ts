import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsString } from "class-validator";

export class UserConsentDto {
  @ApiProperty({ description: "Type of consent", example: "terms" })
  @IsString()
  consentType: string;

  @ApiProperty({ description: "Whether the user has given consent", example: true })
  @IsBoolean()
  given: boolean;

  @ApiProperty({ description: "When the consent was recorded", example: "2024-01-01T00:00:00.000Z" })
  @IsDateString()
  timestamp: string;

  constructor(partial: Partial<UserConsentDto>) {
    Object.assign(this, partial);
  }
}
