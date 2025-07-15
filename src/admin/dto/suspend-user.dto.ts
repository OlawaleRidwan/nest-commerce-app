import { IsBoolean, IsString } from 'class-validator';

export class SuspendUserDto {
  @IsString()
  userId: string;

  @IsBoolean()
  suspended: boolean;
}
