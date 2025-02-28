import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength, Matches } from "class-validator";
import { ChangePasswordModel } from "../models/change-password.model";

export class ChangePasswordDto implements ChangePasswordModel {
  @ApiProperty({
    example: "OldPass123!",
    description: "Current password for verification",
  })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    example: "NewStrongPass123!",
    description: "New password with security requirements",
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: "New password must be at least 8 characters long." })
  @Matches(/[A-Z]/, {
    message: "New password must contain at least one uppercase letter.",
  })
  @Matches(/[a-z]/, {
    message: "New password must contain at least one lowercase letter.",
  })
  @Matches(/\d/, { message: "New password must contain at least one number." })
  @Matches(/[@$!%*?&]/, {
    message:
      "New password must contain at least one special character (@$!%*?&).",
  })
  newPassword: string;

  constructor(partial: Partial<ChangePasswordDto>) {
    Object.assign(this, partial);
  }
}
