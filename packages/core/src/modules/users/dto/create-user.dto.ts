import { IsString, IsEmail, IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: "User password", example: "password123" })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: "First name of the user", example: "John" })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: "Last name of the user", example: "Doe" })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  constructor(partial: Partial<CreateUserDto>) {
    Object.assign(this, partial);
  }
}