import { IsEmpty, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ProductCategory } from "../entities/product.entity";
import { User } from "src/auth/entities/auth.entity";
import { Types } from 'mongoose';


export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @IsOptional()
    @IsString()
    readonly description: string;
    
    @IsOptional()
    @IsString()
    readonly color: string;

    @IsOptional()
    @IsString()
    readonly size: string;

    @IsNotEmpty()
    @IsNumber()
    readonly price: number;


    @IsNotEmpty()
    @IsNumber()
    readonly quantity: number;

    @IsNotEmpty()
    @IsEnum(ProductCategory, {message: "Please enter correct category"})
    readonly category: ProductCategory;
    
    
    // @IsEmpty({message: "You cannot pass user id"})
    
    // readonly user?: Types.ObjectId;
    
    
}
