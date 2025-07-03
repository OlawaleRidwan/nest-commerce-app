import {
  Controller,
  Post,
  Get,
  Delete,
  Req,
  Res,
  Body,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CartService } from './services/cart.service';
import { GuestCartService } from './services/guestCart.service';
import { RequestWithUser } from '../types/request-with-user.interface';
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly guestCartService: GuestCartService,
  ) {}

  @Post('add')
  async addToCart(
    @Req() req: RequestWithUser, @Res() res: Response, @Body() body) {
    try {
      const { productId, quantity, price } = body;

      if (!productId || quantity <= 0) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: 'Invalid input' });
      }

      let cart;
      if (req.user?.userId) {
        const userId = req.user.userId;
        cart = await this.cartService.addToCart(userId, productId, quantity, price);
      } else {
        const cartId = this.guestCartService.getGuestCartId(req, res);
        cart = await this.guestCartService.addToGuestCart(cartId, productId, quantity, price);
      }

      return res.status(HttpStatus.OK).json({ success: true, cart });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  }

  @Post('remove')
  async removeFromCart(
    @Req() req: RequestWithUser, 
    @Res() res: Response, 
    @Body() body) {
    try {
      const { productId } = body;

      if (!productId) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: 'Invalid input' });
      }

      let cart;
      if (req.user?.userId) {
        const userId = req.user.userId;
        cart = await this.cartService.removeFromCart(userId, productId);
      } else {
        const cartId = this.guestCartService.getGuestCartId(req, res);
        cart = await this.guestCartService.removeFromGuestCart(cartId, productId);
      }

      return res.status(HttpStatus.OK).json({ success: true, cart });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  }

  @Get()
  async getCart(
    @Req() req: RequestWithUser,
     @Res() res: Response) {
    try {
      let cart;
      if (req.user?.userId) {
        const userId = req.user.userId;
        cart = await this.cartService.getCart(userId);
      } else {
        const cartId = this.guestCartService.getGuestCartId(req, res);
        cart = await this.guestCartService.getGuestCart(cartId);
      }

      return res.status(HttpStatus.OK).json({ success: true, cart });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  }

  @Delete('clear')
  async clearCart(
    @Req() req: RequestWithUser,
     @Res() res: Response) {
    try {
      let cart;
      if (req.user?.userId) {
        const userId = req.user.userId;
        cart = await this.cartService.clearCart(userId);
      } else {
        const cartId = this.guestCartService.getGuestCartId(req, res);
        cart = await this.guestCartService.clearGuestCart(cartId);
      }

      return res
        .status(HttpStatus.OK)
        .json({ success: true, message: 'Cart cleared', cart });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  }
}
