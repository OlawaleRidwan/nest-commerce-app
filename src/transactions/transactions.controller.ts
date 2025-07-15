// src/payments/payments.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  Res,
  HttpStatus,
  HttpException,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Request, Response } from 'express';
import { TransactionService } from './transactions.service';
import { WalletService } from '../wallet/wallet.service';
import { AuthService } from '../auth/auth.service';
import {
PaystackUtil
} from '../paystack/paystack.service';
import { AuthGuard } from '@nestjs/passport'
// import { sendEmail } from '../utils/send-message.util';
// import { JwtAuthGuard } from '../auth/guards/';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { hmacProcess} from "../utils/hashing";
import { InitiateWithdrawalDto } from './dto/initiate-withdrawal.dto'
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { UserService } from 'src/user/user.service';
import { UserSignedUpEvent } from 'src/events/user-signed-up.event';
import { InitiateTransactionDto } from './dto/initiate-transaction.dto';

@Controller('payments')
export class TransactionsController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly walletService: WalletService,
    private readonly authService: AuthService,
    private readonly payStackUtil: PaystackUtil,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private eventBus: EventBus,

     
  ) {}

  @Post('initiate')
  async initiateTransaction(
    @Body() createTransactionDto: InitiateTransactionDto,
    @Res() res: Response,
  ) {
    try {
      const { product, buyerEmail, buyerName, seller, quantity, price, totalPrice, paymentMethod } =
        createTransactionDto;

      // Step 1: Initiate transaction with Paystack
      const paystackResponse = await this.payStackUtil.initiateTransaction({
        product,
        buyerEmail,
        buyerName,
        seller,
        quantity,
        price,
        totalPrice,
        paymentMethod,
      });

      if (!paystackResponse || !paystackResponse.data.authorization_url) {
        throw new HttpException(
          'Failed to initiate transaction with Paystack',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Transaction initiated successfully',
        paymentUrl: paystackResponse.data.authorization_url,
      });
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error creating transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('withdraw')
  async initiateWithdrawal(
    @Body() initiateWithdrawalDto: InitiateWithdrawalDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const { userId } = req.user as { userId: string };
      const { amount } = initiateWithdrawalDto;

      // Step 1: Fetch user's wallet details
      const wallet = await this.walletService.getWallet(userId);
      console.log("Wallet",wallet)
      if (!wallet) {
        throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
      }

      if (wallet.balance < amount) {
        throw new HttpException('Insufficient balance', HttpStatus.BAD_REQUEST);
      }

      const { bankName, accountNumber, accountHolderName } = wallet.accountDetails;

      // Map the bank name to a Paystack bank code
      const bankCode = await this.payStackUtil.getBankCode(bankName);
      if (!bankCode) {
        throw new HttpException('Invalid bank name', HttpStatus.BAD_REQUEST);
      }

      console.log("Bank code ",bankCode)
      // Step 2: Create transfer recipient
      const recipientData = await this.payStackUtil.createTransferRecipient(
        accountHolderName,
        accountNumber,
        bankCode.code,
      );

      console.log("Recepient Data", recipientData)
      const recipientCode = recipientData.data.recipient_code;

      // Step 3: Initiate withdrawal
      const withdrawalData = await this.payStackUtil.initiateWithdrawal(recipientCode, amount);

      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Withdrawal initiated',
        withdrawal: withdrawalData,
      });
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error processing withdrawal',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transactions/:id')
  async getTransactionById(@Param('id') id: string, @Res() res: Response) {
    try {
      const transaction = await this.transactionService.getTransactionById(id);

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      return res.status(HttpStatus.OK).json(transaction);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error fetching transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('transactions')
  async getAllTransactions(@Res() res: Response) {
    try {
      const transactions = await this.transactionService.getAllTransactions();
      return res.status(HttpStatus.OK).json(transactions);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error fetching transactions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('webhook')
  async paystackWebhook(
    @Req() req: any,
    @Res() res: Response,
    @Headers('x-paystack-signature') signature: string,
    @Headers('x-forwarded-for') ip: string,
  ) {
    try {
      const PAYSTACK_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220'];
      const requestIP = ip || req.socket.remoteAddress || '';

      // Verify IP is from Paystack
      if (!PAYSTACK_IPS.includes(requestIP as string)) {
        throw new HttpException('Forbidden: Invalid IP', HttpStatus.FORBIDDEN);
      }

      const event = req.body;

      // Validate Paystack Signature
      const hash = crypto
        .createHmac('sha512', this.configService.get('PAYSTACK_SECRET_KEY')!)
        .update(JSON.stringify(event))
        .digest('hex');

      if (hash !== signature) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      if (event.event == 'charge.success') {
        const amount = req.body.data.amount;
        let totalPrice = amount / 100;
        const metadata = event.data.metadata || {};
        const {
          product,
          buyerName,
          buyerEmail,
          seller,
          quantity,
          price,
          paymentMethod,
        } = metadata;

        const paymentId = event.data.reference;

        if (!buyerEmail || !product) {
          throw new HttpException('Missing metadata', HttpStatus.BAD_REQUEST);
        }

        totalPrice = amount / 100;
        await this.transactionService.createTransaction({
          product,
          buyerEmail,
          buyerName,
          paymentId,
          seller,
          quantity,
          price,
          totalPrice,
          paymentMethod,
        });

        // Log the transaction
        fs.appendFileSync('../paystack_logs.txt', JSON.stringify(req.body, null, 2) + '\n');

        // Send email notification
        const message = 'Your payment has been received';
        this.eventBus.publish(
          new UserSignedUpEvent(buyerEmail as string, message)
        );
      }

      if (event.event == 'transfer.success') {
        const { userId } = req.user as { userId: string };
        const { amount } = req.body;

        const wallet = await this.walletService.getWallet(userId);
        if (!wallet) {
          throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
        }

        await this.walletService.debitWallet(userId, amount);

        const user = await this.userService.getOneByQuery({ userId });
        if (!user) {
          throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
        }
        const userEmail = user.email;
        const message = 'Your Withdrawal has been processed successfully';
        this.eventBus.publish(
            new UserSignedUpEvent(userEmail as string, message)
          );
      } else if (event.event === 'transfer.failed') {
        const { userId } = req.user as { userId: string };
        const { amount } = req.body;
        const wallet = await this.walletService.getWallet(userId);

        if (!wallet) {
          throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
        }

        await this.walletService.creditWallet(userId, amount);
      }

      return res.sendStatus(HttpStatus.OK);
    } catch (error) {
      throw new HttpException(
        'Webhook processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}