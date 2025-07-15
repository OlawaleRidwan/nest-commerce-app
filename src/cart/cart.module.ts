import { Module } from '@nestjs/common';
import { CartService } from './services/cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {AuthModule} from '../auth/auth.module'
import { Cart, CartEntity } from './entities/cart.entity';
import { GuestCartService } from './services/guestCart.service';

@Module({
  imports: [
  AuthModule,
  MongooseModule.forFeature([
    {name: Cart.name, schema: CartEntity}
  ])
  ],
  controllers: [CartController],
  providers: [CartService,
    GuestCartService
  ],
})
export class CartModule {}
