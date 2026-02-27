import { addCategoryInput, addCategoryResponse, CategoryResponse, updateCategory } from "../types/ProductTypes";
import { PrismaClient } from "@prisma/client/extension";
export interface Repo{
    addCategory(input:addCategoryInput,db:PrismaClient):Promise<addCategoryResponse>
    deleteCategory(categoryId:string,db:PrismaClient):Promise<CategoryResponse>
    updateCategory(input:updateCategory,db:PrismaClient):Promise<CategoryResponse>
    findCategoryById(categoryId:string,db:PrismaClient):Promise<CategoryResponse | null>
    findAllCategories(db:PrismaClient):Promise<CategoryResponse[]>
}