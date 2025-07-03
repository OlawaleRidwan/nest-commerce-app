import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from './user/user.module';
import { RedisModule } from './redis/redis.module';
import { WalletModule } from './wallet/wallet.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true
    }),
    MongooseModule.forRoot(process.env.DB_URL!),
    EventEmitterModule.forRoot(),
    RedisModule,
    ProductModule,
    AuthModule,
    UserModule,
    WalletModule,
    TransactionsModule,
    CartModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
