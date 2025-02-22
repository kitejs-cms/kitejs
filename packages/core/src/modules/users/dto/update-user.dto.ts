import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserModel } from '../models/update-user.model';

export class UpdateUserDto
  extends PartialType(CreateUserDto)
  implements UpdateUserModel {}
