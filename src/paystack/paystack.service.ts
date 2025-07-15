// src/utils/paystack.util.ts
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PaystackUtil {
  private readonly secretKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
  const key = this.configService.get<string>('PAYSTACK_SECRET_KEY');
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not defined');
  }
  this.secretKey = key;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getBankList() {
    try {
      const res$ = this.httpService.get('https://api.paystack.co/bank', {
        headers: this.headers,
      });
      const response = await lastValueFrom(res$);
      return response.data.data;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch bank list');
    }
  }

  async getBankCode(bankName: string) {
    const list = await this.getBankList();
    return list.find(
      (b: any) => b.name.toLowerCase() === bankName.toLowerCase(),
    );
  }

  async resolveAccountNumber(accountNumber: string, bankCode: string) {
    try {
      const res$ = this.httpService.get(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers: this.headers },
      );
      const response = await lastValueFrom(res$);
      return response.data.data;
    } catch (error) {
      throw new InternalServerErrorException('Account resolution failed');
    }
  }

  async initiateTransaction(payload: {
    product: string;
    buyerEmail: string;
    buyerName: string;
    seller: string;
    quantity: number;
    price: number;
    totalPrice: number;
    paymentMethod: string;
  }) {
    const {product, buyerEmail,buyerName,seller,quantity,price,totalPrice,paymentMethod } = payload;
    if (totalPrice <= 0) throw new Error('Amount must be > 0');

    const res$ = this.httpService.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: buyerEmail,
        amount: Math.round(totalPrice * 100),
        currency: 'NGN',
        callback_url: 'https://www.google.com',
        metadata: payload,
      },
      { headers: this.headers },
    );
    const response = await lastValueFrom(res$);
    return response.data;
  }

  async createTransferRecipient(name: string, accountNumber: string, bankCode: string) {
    const res$ = this.httpService.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'nuban',
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      },
      { headers: this.headers },
    );
    const response = await lastValueFrom(res$);
    return response.data;
  }

  async initiateWithdrawal(recipientCode: string, amount: number) {

    try {

    const res$ = this.httpService.post(
      'https://api.paystack.co/transfer',
      {
        source: 'balance',
        amount: amount * 100,
        recipient: recipientCode,
        reason: 'User withdrawal',
      },
      { headers: this.headers },
    );
    const response = await lastValueFrom(res$);

    return response.data;
  }
  catch (error) {
    // Log full Paystack error response
    console.error('❌ Paystack withdrawal error:', {
      message: error?.response?.data?.message,
      status: error?.response?.status,
      details: error?.response?.data,
    });
  }
}

}
