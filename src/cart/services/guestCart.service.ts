import { Injectable, Res, Req } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Response, Request } from 'express';
// import { InjectRedis } from '@nestjs-modules/ioredis';
import { RedisService } from 'src/redis/redis.service'; // custom wrapper for redisClient

import Redis from 'ioredis';

const CACHE_EXPIRATION = 5 * 60; // 5 minutes

@Injectable()
export class GuestCartService {
  constructor(
    private readonly redisService: RedisService) {}

  // ✅ Get or create guest cart ID and store in cookie
  getGuestCartId(req: Request, res: Response): string {
    const existingId = req.cookies?.guestCartId;
    if (!existingId) {
      const guestCartId = uuidv4();
      res.cookie('guestCartId', guestCartId, {
        httpOnly: true,
        maxAge: CACHE_EXPIRATION * 1000,
      });
      return guestCartId;
    }
    return existingId;
  }

  // ✅ Get guest cart
  async getGuestCart(cartId: string): Promise<any> {
    const cart = await this.redisService.get(`guestCart:${cartId}`);
    return cart ? JSON.parse(cart) : { items: [], totalPrice: 0 };
  }

  // ✅ Save guest cart
  async saveGuestCart(cartId: string, cartData: any): Promise<void> {
    await this.redisService.set(
      `guestCart:${cartId}`,
      JSON.stringify(cartData),
      CACHE_EXPIRATION,
    );
  }

  // ✅ Add to cart
  async addToGuestCart(
    cartId: string,
    productId: string,
    quantity: number,
    price: number,
  ): Promise<any> {
    const cart = await this.getGuestCart(cartId);

    const existingItem = cart.items.find((item) => item.product === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price,
        total: quantity * price,
      });
    }

    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    await this.saveGuestCart(cartId, cart);
    return cart;
  }

  // ✅ Remove from cart
  async removeFromGuestCart(cartId: string, productId: string): Promise<any> {
    const cart = await this.getGuestCart(cartId);

    cart.items = cart.items.filter((item) => item.product !== productId);

    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    await this.saveGuestCart(cartId, cart);
    return cart;
  }

  // ✅ Clear guest cart
  async clearGuestCart(cartId: string): Promise<{ items: any[]; totalPrice: number }> {
    await this.redisService.del(`guestCart:${cartId}`);
    return { items: [], totalPrice: 0 };
  }
}
