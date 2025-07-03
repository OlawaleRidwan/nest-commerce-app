// src/transactions/dto/create-transaction.dto.ts
import {
  IsString,
  IsEmail,
  IsNumber,
  Min,
  IsIn,
  IsMongoId,
  IsInt,
} from 'class-validator';


export class InitiateWithdrawalDto {

  @IsNumber()
  @Min(0, { message: 'Total price must be a positive number' })
  amount: number;

}