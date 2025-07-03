// src/cart/cart.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cart, CartDocument } from '../entities/cart.entity';
import { RedisService } from 'src/redis/redis.service'; // custom wrapper for redisClient
// import { Product } from 'src/products/schemas/product.schema';
import { Types } from 'mongoose';

@Injectable()
export class CartService {
  private readonly CACHE_EXPIRATION = 60 * 60 * 2; // 2 hours

  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private readonly redisService: RedisService, // wraps redisClient
  ) {}

  private getCacheKey(userId: string): string {
    return `cart:${userId}`;
  }

  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    price: number,
  ) {
    try {
      const cacheKey = this.getCacheKey(userId);
      let cart = await this.cartModel.findOne({ user: userId });

      if (!cart) {
        cart = await this.cartModel.create({
          user: userId,
          items: [],
          totalPrice: 0,
        });
      }

      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId,
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.total = existingItem.quantity * existingItem.price;
      } else {
        cart.items.push({
          product: new Types.ObjectId(productId),
          quantity,
          price,
          total: quantity * price,
        });
      }

      cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
      await cart.save();

      await this.redisService.set(cacheKey, JSON.stringify(cart));
      return cart;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  async removeFromCart(userId: string, productId: string) {
    const cacheKey = this.getCacheKey(userId);
    const cart = await this.cartModel.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { product: productId } } },
      { new: true },
    );

    if (!cart) throw new NotFoundException('Cart not found');

    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.total, 0);
    await cart.save();

    await this.redisService.set(cacheKey, JSON.stringify(cart));
    return cart;
  }

  async getCart(userId: string) {
    const cacheKey = this.getCacheKey(userId);

    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const cart = await this.cartModel.findOne({ user: userId });
    if (!cart) return { items: [], totalPrice: 0 };

    const cartItems = await this.cartModel.aggregate([
      { $match: { user: new Types.ObjectId(userId) } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          product: '$items.product',
          quantity: '$items.quantity',
          name: '$productDetails.name',
          image: '$productDetails.image',
          price: '$productDetails.price',
          total: { $multiply: ['$items.quantity', '$productDetails.price'] },
        },
      },
    ]);

    const totalPrice = cartItems.reduce((sum, item) => sum + item.total, 0);
    const cartData = { items: cartItems, totalPrice };

    await this.redisService.set(
      cacheKey,
      JSON.stringify(cartData),
      this.CACHE_EXPIRATION,
    );

    return cartData;
  }

  async clearCart(userId: string) {
    const updatedCart = await this.cartModel.findOneAndUpdate(
      { user: userId },
      { items: [], totalPrice: 0 },
      { new: true },
    );

    await this.redisService.del(this.getCacheKey(userId));
    return updatedCart;
  }
}
