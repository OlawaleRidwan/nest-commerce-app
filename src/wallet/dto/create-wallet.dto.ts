import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class AccountDetailsDto {
  @IsNotEmpty({ message: 'Bank name is required' })
  @IsString()
  bankName: string;

  @IsNotEmpty({ message: 'Invalid account number format' })
  @Matches(/^\d{10,20}$/, {
    message: 'Invalid account number format',
  })
  accountNumber: string;

  @IsNotEmpty({ message: 'Account holder name is required' })
  @IsString()
  accountHolderName: string;
}

export class CreateWalletDto {
  // @IsNotEmpty({ message: 'User ID is required' })
  // @IsMongoId({ message: 'Invalid user ID format' })
  // user: string;
  // @IsOptional()
  // @IsNumber({}, { message: 'Balance must be a number' })
  // @Min(0, { message: 'Balance must be a positive number' })
  // balance?: number = 0;

  // @IsOptional()
  // @IsArray()
  // @IsMongoId({ each: true, message: 'Invalid transaction ID format' })
  // transactions?: string[];

  @ValidateNested()
  @Type(() => AccountDetailsDto)
  @IsNotEmpty()
  accountDetails: AccountDetailsDto;
}
