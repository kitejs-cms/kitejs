import { IsJWT, IsOptional } from 'class-validator';

export class AuthResponseDto {
  @IsJWT()
  accessToken: string;

  @IsOptional()
  @IsJWT()
  refreshToken?: string | null;

  constructor(partial: Partial<AuthResponseDto>) {
    Object.assign(this, partial);
  }
}
