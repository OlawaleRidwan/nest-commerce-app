import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength, MaxLength, ValidateIf, IsNumber, IsEnum } from 'class-validator';
import { Role } from 'src/auth/enums/roles.enum';
export class SignupDto {

  @IsNotEmpty({ message: 'Email or phone number is required' })

  @ValidateIf((o) => o.email_or_phone_number.includes('@'))
  @IsEmail({}, { message: 'Must be a valid email address' })

  @ValidateIf((o) => !o.email_or_phone_number.includes('@'))
  @Matches(/^\d{10,15}$/, {
        message: 'Phone number must be between 10 and 15 digits',
    })
  email_or_phone_number: string;


  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_.]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and dots',
  })
  username: string;


  @IsOptional()
  @IsEnum(Role, {message: "Please enter correct category"})
  role: "string";

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message:
      'Password must contain at least one uppercase, one lowercase, one number, and one special character',
  })
  password: string;

}

export class SigninDto {
  @IsNotEmpty()
  email_or_phone_number: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message:
      'Password must contain at least one uppercase, one lowercase, one number, and one special character',
  })
  password: string;
}

export class AcceptCodeDto {
  @IsNotEmpty()
  email_or_phone_number: string;

  @IsNumber()
  providedCode: number;
}

export class AcceptForgotPasswordCodeDto {
  @IsNotEmpty()
  email_or_phone_number: string;

  @IsNumber()
  providedCode: number;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, {
    message:
      'Password must contain at least one uppercase, one lowercase, one number, and one special character',
  })
  newPassword: string;
}

export class ForgotPasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Email or phone number is required' })
    email_or_phone_number: string;
  }

export class SendVerificationCodeDto {
@IsString()
@IsNotEmpty({ message: 'Email or phone number is required' })
email_or_phone_number: string;
}