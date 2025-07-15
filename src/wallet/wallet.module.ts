import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './entities/wallet.entity';
import { AuthModule } from 'src/auth/auth.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }]),
    // forwardRef(() => TransactionsModule),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports:[WalletService]
})
export class WalletModule {}
