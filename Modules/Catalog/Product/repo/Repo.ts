import { PrismaClient } from "@prisma/client/extension";
import { AddProductInput, ProductResponse } from "../types/types";

export interface ProductRepo{
    getAllProducts(db:PrismaClient):Promise<ProductResponse[]>;
    addProduct(AddProductInput:AddProductInput[],db:PrismaClient):Promise<ProductResponse[]>
}