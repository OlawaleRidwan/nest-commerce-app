import { IsString } from 'class-validator';

export class DeleteUserDto {
  @IsString()
  userId: string;
}
