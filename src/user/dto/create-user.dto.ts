import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, MaxLength, ValidateIf, IsNumber, IsEnum } from 'class-validator';
import { Role } from 'src/auth/enums/roles.enum';

export class UpdateUserDetailsDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName?: string;
  
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName?: string;
  
    @IsOptional()
    @IsString()
    @MinLength(5)
    @MaxLength(255)
    address?: string;
  
    @ValidateIf((o) => o.oldPassword !== undefined)
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
      message:
        'New password must contain uppercase, lowercase, number and special character',
    })
    newPassword?: string;
  
    @ValidateIf((o) => o.newPassword !== undefined)
    @IsString()
    @MinLength(8)
    @MaxLength(50)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
      message:
        'Old password must contain uppercase, lowercase, number and special character',
    })
    oldPassword?: string;
  }

