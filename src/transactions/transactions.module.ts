import { forwardRef, Module } from '@nestjs/common';
import { TransactionService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { AuthModule } from 'src/auth/auth.module'
import { Transaction, TransactionEntity } from './entities/transaction.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { ProductModule } from '../product/product.module';
import { WalletService } from 'src/wallet/wallet.service';
import { PaystackModule } from 'src/paystack/paystack.module';
import { UserModule } from 'src/user/user.module';
import { CqrsModule } from '@nestjs/cqrs';


console.log('WalletService:', require('../wallet/wallet.service').WalletService);
console.log('ProductService:', require('../product/product.service').ProductService);
@Module({
  imports: [
    ProductModule,
    PaystackModule,
    WalletModule,
    AuthModule,
    UserModule,
    CqrsModule,
    // forwardRef(() => WalletModule), 
    MongooseModule.forFeature([
      {name: Transaction.name, schema: TransactionEntity}])
  ],
  controllers: [TransactionsController],
  providers: [TransactionService],
  exports: [TransactionService]
})
export class TransactionsModule {}
