import { ApiProperty } from '@nestjs/swagger';
import { SettingType } from '../models/setting-type.enum';
import { Exclude } from 'class-transformer';
import { ObjectId } from 'mongoose';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';

export class SettingResponseDto {
  @ApiProperty({
    description: 'Namespace of the setting (e.g., plugin name).',
    example: 'plugin-blog',
  })
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @ApiProperty({
    description: 'Unique key for the setting within the namespace.',
    example: 'itemsPerPage',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Value of the setting.',
    example: { value: 10 },
  })
  @IsObject()
  @IsNotEmpty()
  value: unknown;

  @ApiProperty({
    description: 'Scope of the setting (e.g., global, plugin, theme).',
    enum: SettingType,
    example: SettingType.PLUGIN,
  })
  @IsOptional()
  @IsEnum(SettingType)
  type: SettingType;

  @Exclude()
  __v: number;

  @Exclude()
  _id: ObjectId;

  constructor(partial: Partial<SettingResponseDto>) {
    Object.assign(this, partial);
  }
}
