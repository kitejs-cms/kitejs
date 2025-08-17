import { IsArray, IsString } from 'class-validator';

export class CreateGalleryDto {
  @IsString()
  title: string;

  @IsArray()
  images: string[];
}
