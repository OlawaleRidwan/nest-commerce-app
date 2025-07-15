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
import { PaymentMethod } from '../enums/payment-method.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class InitiateTransactionDto {
  @IsMongoId()
  @IsString()
  product: string;

  @IsEmail({}, { message: 'Invalid email format' })
  buyerEmail: string;

  @IsString()
  buyerName: string;

//   @IsString()
//   paymentId: string;

  @IsMongoId()
  @IsString()
  seller: string;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @IsNumber()
  @Min(0, { message: 'Total price must be a positive number' })
  price: number;

  @IsNumber()
  @Min(0, { message: 'Total price must be a positive number' })
  totalPrice: number;


//   @IsIn(['pending', 'completed', 'failed'], {
//     message: 'Invalid transaction status',
//   })
//   status?: TransactionStatus;

  @IsIn(['card', 'paypal', 'crypto', 'bank_transfer'], {
    message: 'Invalid payment method',
  })
  paymentMethod: PaymentMethod;
}