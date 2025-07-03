// transaction.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction } from './entities/transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import { ProductService } from '../product/product.service';
// import { PaymentMethod } from './enums/payment-method.enum'
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly walletService: WalletService,
    private readonly productService: ProductService,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto) {
    const {
      product,
      buyerEmail,
      buyerName,
      paymentId,
      seller,
      quantity,
      price,
      totalPrice,
      paymentMethod,
    } = createTransactionDto;

    // Check if the product exists
    const existingProduct = await this.productService.getProductById(product);
    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    // Check if the seller exists
    const sellerWallet = await this.walletService.getWallet(seller);
    if (!sellerWallet) {
      throw new NotFoundException('Seller wallet not found');
    }

    // Create transaction
    const transaction = await this.transactionModel.create({
      product,
      buyerEmail,
      buyerName,
      paymentId,
      seller,
      quantity,
      price,
      totalPrice,
      status: 'completed',
      paymentMethod,
    });

    // Update product quantity
    await this.productService.updateProductQuantityById(product, quantity);

    // Credit seller's wallet
    await this.walletService.creditWallet(seller, price);

    // Add transaction to wallet
    const transactionId = transaction._id.toString();
    await this.walletService.updateWalletWithTransaction(seller, transactionId );

    return transaction;
  }

  async getTransactionById(transactionId: string) {
    return this.transactionModel
      .findById(transactionId)
      .populate('product seller');
  }

  async getAllTransactions() {
    return this.transactionModel.find().populate('product seller');
  }
}