import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({ description: "User ID", example: "63f6e5ad4e5f4a6b97a5c1a2" })
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  email: string;

  @ApiProperty({ description: "First name of the user", example: "John" })
  firstName: string;

  @ApiProperty({ description: "Last name of the user", example: "Doe" })
  lastName: string;

  @ApiProperty({ description: "Status of the user", example: "active" })
  status: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
