import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseFloatPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('create-wallet')
  async createWallet(
    @Req() req,
    @Body() createWalletDto: CreateWalletDto) {

    const { userId} = req.user
    return this.walletService.createWallet(userId,createWalletDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('get-wallet/:userId')
  async getWallet(@Param('userId') userId: string) {
    
    return this.walletService.getWallet(userId);
  }

  @Patch('credit/:userId')
  async creditWallet(
    @Param('userId') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.walletService.creditWallet(userId, amount);
  }

  @Patch('debit/:userId')
  async debitWallet(
    @Param('userId') userId: string,
    @Body('amount') amount: number,
  ) {
    return this.walletService.debitWallet(userId, amount);
  }

  @Patch('transaction/:userId/:transactionId')
  async updateWalletWithTransaction(
    @Param('userId') userId: string,
    @Param('transactionId') transactionId: string,
  ) {
    return this.walletService.updateWalletWithTransaction(userId, transactionId);
  }

  @Patch('account-details/:userId')
  async updateAccountDetails(
    @Param('userId') userId: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.walletService.updateAccountDetails(userId, updateWalletDto);
  }
}
