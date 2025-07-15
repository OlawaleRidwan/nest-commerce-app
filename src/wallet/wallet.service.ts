import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallet} from './entities/wallet.entity';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
// import { TransactionService } from 'src/transactions/transactions.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectModel(Wallet.name)
    private walletModel: Model<Wallet>,
    //  @Inject(forwardRef(() => TransactionService))
    // private readonly transactionService: TransactionService,
  ) {}

  async createWallet(userId: string,createWalletDto: CreateWalletDto): Promise<Wallet> {
    const { accountDetails } = createWalletDto;

    const existingWallet = await this.walletModel.findOne({ userId });
    if (existingWallet) return existingWallet;

    const newWallet = new this.walletModel({
      user: userId,
      balance: 0,
      // transactions: [],
      accountDetails,
    });

    return await newWallet.save();
  }

  async getWallet(userId: string): Promise<Wallet> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    // const wallet = await this.walletModel.findOne({ user: userId }).populate('transactions');
    const wallet = await this.walletModel.findOne({ user: userId })
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async creditWallet(userId: string, amount: number): Promise<Wallet> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    if (amount <= 0) throw new BadRequestException('Amount must be greater than zero');

    const wallet = await this.walletModel.findOneAndUpdate(
      { user: userId },
      { $inc: { balance: amount } },
      { new: true },
    );

    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }



async updateWalletWithTransaction(userId: string, transactionId: string): Promise<Wallet> {

  const MAX_RECENT_TRANSACTIONS = 10;

  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(transactionId)) {
    throw new BadRequestException('Invalid user ID or transaction ID');
  }

  const wallet = await this.walletModel.findOne({ user: userId });
  if (!wallet) {
    throw new NotFoundException('Wallet not found');
  }

  // Add new transaction ID at the beginning
  wallet.transactions.unshift(new Types.ObjectId(transactionId));

  // Trim to only most recent N transactions
  if (wallet.transactions.length > MAX_RECENT_TRANSACTIONS) {
    wallet.transactions = wallet.transactions.slice(0, MAX_RECENT_TRANSACTIONS);
  }

  return await wallet.save();
}

  async debitWallet(userId: string, amount: number): Promise<Wallet> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const wallet = await this.getWallet(userId);
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    wallet.balance -= amount;
    return await wallet.save();

  }

  async updateAccountDetails(userId: string, updateDto: UpdateWalletDto): Promise<Wallet> {
    const { accountDetails } = updateDto;
    console.log(accountDetails)
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
   
    const wallet = await this.walletModel.findOneAndUpdate(
      { user: userId },
      { accountDetails},
      { new: true },
    );

    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }
}
