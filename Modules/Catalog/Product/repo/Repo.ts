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
} from "../types/types";

export interface ProductRepo {
  getAllProducts(db: PrismaClient): Promise<GetAllProductsResponse[]>;
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
}
