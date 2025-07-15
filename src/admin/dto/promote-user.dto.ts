import { IsString, IsEnum } from 'class-validator';
import { Role } from '../../auth/enums/roles.enum';

export class PromoteUserDto {
  @IsString()
  userId: string;

  @IsEnum(Role)
  newRole: Role;
}
