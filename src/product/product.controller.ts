import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFiles, ParseFilePipeBuilder, HttpStatus, Query, ValidationPipe, UsePipes, Put, BadRequestException } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { SearchProductDto } from './dto/search-product.dto';
import { Types } from 'mongoose';


@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('create-product')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FilesInterceptor('files')) 
  async create(
    @Req() req,
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles(
      new ParseFilePipeBuilder()
      .addFileTypeValidator({
          fileType: /(jpg|jpeg|png)$/
      })
      .addMaxSizeValidator({
          maxSize: 100 * 1000,
          message: "File size must be less than 10kb"
      })
      .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
      })
  ) files: Array<Express.Multer.File>
  ) {
    
    const { userId} = req.user;
    return this.productService.createProduct( userId,createProductDto, files);
  }


  @UseGuards(AuthGuard('jwt'))
  @Get('get-products')
  async getAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.productService.getAllProducts(page, limit);
  }


@UseGuards(AuthGuard('jwt'))
@UseInterceptors(FilesInterceptor('files'))
@Put('update-product/:id')
async updateProduct(
    @Param('id') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles(
      new ParseFilePipeBuilder()
      .addFileTypeValidator({
          fileType: /(jpg|jpeg|png)$/
      })
      .addMaxSizeValidator({
          maxSize: 10 * 1000,
          message: "File size must be less than 10kb"
      })
      .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: false,
      })
  ) files: Array<Express.Multer.File>
  ) {
    
    return this.productService.updateProduct( productId,updateProductDto, files);
  }

@UseGuards(AuthGuard('jwt'))
@Get('product/:id')
  async getProductById(@Param('id') id: string) {
    return this.productService.getProductById(id);
  }

@UseGuards(AuthGuard('jwt'))
@Delete('delete-product/:id')
  async deleteProduct(@Param('id') id: string): Promise<{ message: string }> {
    return this.productService.deleteProduct(id);
  }

@UseGuards(AuthGuard('jwt'))
@Get('seller/:id')
  async getProductsBySeller(@Param('id') id: string) {
    return this.productService.getProductsBySeller(id);
  }

@UseGuards(AuthGuard('jwt'))
@Get('category/:category')
  async getProductsByCategory(
    @Param('category') category: string,
    @Query('user') user?: string,
  ) {
    return this.productService.getProductsByCategory(category, { user });
  }
  
  @Patch('product-quantity/:id')
  async updateProductQuantityById(
    @Param('id') id: string,
    @Query('quantity') quantity?: number)
   {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    if (typeof quantity !== 'number') {
      throw new BadRequestException('Quantity must be a number');
    }

    return this.productService.updateProductQuantityById(id, quantity);
  }


  @UseGuards(AuthGuard('jwt'))
 @Get('search')
  @UsePipes(new ValidationPipe({ transform: true }))
  async searchProducts(@Query() filter: SearchProductDto) {
    return this.productService.searchProducts(filter);
  }


  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
