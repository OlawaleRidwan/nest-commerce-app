import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, Param } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './entities/product.entity';
import mongoose, { FilterQuery, Types } from 'mongoose';
import { uploadImages } from 'src/utils/aws';
import { RedisService } from '../redis/redis.service'; 
import { SearchProductDto } from './dto/search-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private productModel = mongoose.Model<Product>,
    private redisService: RedisService
  ){}

  async createProduct(userId: string, productDto: CreateProductDto,files: Array<Express.Multer.File>) {
    try {
     

      const { name, price, quantity, description, color, size, category } = productDto;
      const images = await uploadImages(files)
      
      const totalPrice: number = Number(price) + Number(0.05 * price);

      const newProduct = {
        name,
        price,
        totalPrice,
        quantity,
        images,
        description,
        color,
        size,
        category,
        user: userId,
      };

      const product = await this.productModel.create(newProduct);
      const savedProduct = await product.save();

      // Invalidate caches
      const keys = await this.redisService.getClient().keys('products:page:*');
      if (keys.length > 0) {
        await this.redisService.getClient().del(keys);
      }

      await this.redisService.getClient().del(`category:${category}`);

      return { message: "Product created successfully", product: savedProduct };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getAllProducts(page = 1, productsPerPage = 10) {
    const cacheKey = `products:page:${page}`;

    // Check Redis cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const pageNum = Math.max(Number(page) - 1, 0);
      const products = await this.productModel
        .find()
        .sort({ createdAt: -1 })
        .skip(pageNum * productsPerPage)
        .limit(productsPerPage)
        .select('-user')
        .populate('user', 'username email');

      await this.redisService.set(cacheKey, JSON.stringify(products), 3600);

      return products;
    } catch (error) {
      console.error('Failed to get products:', error);
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

    async getProductById(id: string): Promise<Product> {
    const cacheKey = `product:${id}`;

    // Check if product is in cache
    const cachedProduct = await this.redisService.get(cacheKey);
    if (cachedProduct) {
      return JSON.parse(cachedProduct);
    }

    // Fetch from database
    const product = await this.productModel.findById(id).populate('user', 'username email').exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Store in cache for 1 hour (3600 seconds)
    await this.redisService.set(cacheKey, product, 3600 );

    return product;
  }

  async updateProductQuantityById(id: string, quantity: number): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const updatedProduct = await this.productModel.findOneAndUpdate(
      { _id: id },
      { $inc: { quantity: quantity } },
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      throw new NotFoundException('Product not found or could not be updated');
    }

    return updatedProduct;
  }

  async updateProduct(
    id: string,
    body: Partial<Product>,
    files: Array<Express.Multer.File>
  ): Promise<Product> {

    console.log("body: ", body)
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { name, price, quantity, description, color, size, category } = body;
    const images = files?.length > 0 ? await uploadImages(files) : product.images;
    if (name) product.name = name;
    if (price !== undefined) {
      product.price = price;
      product.totalPrice = Number(price) + Number(0.05 * price);
    }
    if (quantity !== undefined) product.quantity = quantity;
    if (description) product.description = description;
    if (color) product.color = color;
    if (size) product.size = size;
    if (category) product.category = category;
    if (images?.length > 0) product.picture = images;

    const savedProduct = await product.save();
    console.log(savedProduct)
    const redisClient = this.redisService.getClient();
    await redisClient.del(`product:${id}`);
    if (category) {
      await redisClient.del(`category:${category}`);
    }

    return savedProduct;
  }

async deleteProduct(id: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel.findByIdAndDelete(id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const redisClient = this.redisService.getClient();
    await redisClient.del(`product:${id}`);
    if (product.category) {
      await redisClient.del(`category:${product.category}`);
    }

    return { message: 'Product deleted successfully' };
  }

 async getProductsBySeller(sellerId: string): Promise<Product[]> {
    if (!Types.ObjectId.isValid(sellerId)) {
      throw new BadRequestException('Invalid seller ID format');
    }

    console.log(sellerId)
    const products = await this.productModel
      .find({ user: sellerId })
      .select('name price category quantity picture')
      .exec();

    return products;
  }

  
  async getProductsByCategory(category: string, filter?: { user?: string }): Promise<Product[]> {
    const cacheKey = `category:${category}`;
    const cachedProducts = await this.redisService.get(cacheKey);

    if (cachedProducts) {
            return JSON.parse(cachedProducts);

    }


    const query: any = { category };
    if (filter?.user) {

      query.user = filter.user;
    }

    const products = await this.productModel.find(query).exec();

    if (products.length === 0) {
      throw new NotFoundException('No products found in this category');
    }

    await this.redisService.set(cacheKey, JSON.stringify(products),  3600 ); // Cache for 1 hour

    return products;
  }

async searchProducts(filter: SearchProductDto): Promise<Product[]> {
    const query: any = {};
    console.log(filter)
    if (filter.name) {
      query.name = { $regex: filter.name, $options: 'i' };
    }

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.price = {};
      if (filter.minPrice !== undefined) {
        query.price.$gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        query.price.$lte = filter.maxPrice;
      }
    }

    if (filter.color) {
      query.color = filter.color;
    }

    if (filter.category) {
      query.category = filter.category;
    }
    console.log(query)
    return this.productModel.find(query).exec();
  }


  async getOneByQuery  (filter: FilterQuery<Product>,select?: string) {

    try {
      console.log(filter)
      const product = await this.productModel.findOne(filter).select(select as string)
      return product
    } catch (error) {
     throw new Error("Error getting product by seller");
  }
  
  };


  findAll() {
    return `This action returns all product`;
  }


  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
