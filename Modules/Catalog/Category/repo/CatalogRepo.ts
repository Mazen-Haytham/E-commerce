import { PrismaClient } from "@prisma/client/extension";
import {
  addCategoryInput,
  addCategoryResponse,
  CategoryResponse,
  updateCategory,
} from "../types/ProductTypes";
import { Repo } from "./Repo";
import { prisma } from "../../../src/shared/prisma";
export class PrismaProductRepo implements Repo {
  findAllCategories = async (db: PrismaClient): Promise<CategoryResponse[]> => {
    const categories: CategoryResponse[] = await db.category.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });
    return categories;
  };
  findCategoryById = async (
    categoryId: string,
    db: PrismaClient,
  ): Promise<CategoryResponse | null> => {
    const category: CategoryResponse | null = await db.category.findUnique({
      where: {
        id: categoryId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });
    return category;
  };
  addCategory = async (
    input: addCategoryInput,
    db: PrismaClient,
  ): Promise<addCategoryResponse> => {
    const newCategories: addCategoryResponse = await db.category.createMany({
      data: input,
      skipDuplicates: true,
    });
    return newCategories;
  };
  updateCategory = async (
    input: updateCategory,
    db: PrismaClient,
  ): Promise<CategoryResponse> => {
    const updatedCategory: CategoryResponse = await db.category.update({
      where: {
        id: input.id,
        deletedAt: null,
      },
      data: input,
      select: {
        id: true,
        name: true,
      },
    });
    return updatedCategory;
  };
  deleteCategory = async (
    categoryId: string,
    db: PrismaClient,
  ): Promise<CategoryResponse> => {
    const deletedCategory: CategoryResponse = await prisma.category.delete({
      where: {
        id: categoryId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });
    return deletedCategory;
  };
}
