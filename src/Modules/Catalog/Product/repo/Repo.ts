import { PrismaClient } from "@prisma/client/extension";
import {
  AddProductInput,
  AddProductResponse,
  GetAllProductsResponse,
  ProductResponse,
  UpdateProductInput,
  UpdateProductResponse,
  DeleteProductResponse,
  GetProductByIdResponse,
  cursorData,
} from "../types/types.js";

export interface ProductRepo {
  getAllProducts(db: PrismaClient,take:number,cursor?:cursorData): Promise<GetAllProductsResponse[]>;
  getProductById(productId: string): Promise<GetProductByIdResponse | null>;
  addProduct(
    AddProductInput: AddProductInput,
    db: PrismaClient,
  ): Promise<AddProductResponse>;
  updateProduct(
    input: UpdateProductInput,
    db: PrismaClient,
  ): Promise<UpdateProductResponse>;
  deleteProduct(
    productId: string,
    db: PrismaClient,
  ): Promise<DeleteProductResponse>;
  checkProductNameExists(name: string): Promise<boolean>;
  checkSKUsExist(
    skus: string[],
  ): Promise<{ sku: string; productName: string }[]>;
}
