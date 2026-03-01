import { PrismaClient } from "@prisma/client/extension";
import {
  addCategoryInput,
  addCategoryResponse,
  CategoryResponse,
  updateCategory,
} from "../types/ProductTypes.js";
import { Repo } from "./Repo.js";
import { prisma } from "../../../../shared/prisma.js";
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

  checkCategoryNamesExist = async (
    names: string[],
    db: PrismaClient,
  ): Promise<CategoryResponse[]> => {
    const existingCategories: CategoryResponse[] = await db.category.findMany({
      where: {
        name: {
          in: names,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });
    return existingCategories;
  };

  checkCategoryNameExists = async (
    name: string,
    excludeId: string,
    db: PrismaClient,
  ): Promise<CategoryResponse | null> => {
    const duplicateCategory: CategoryResponse | null =
      await db.category.findFirst({
        where: {
          name: name,
          id: {
            not: excludeId,
          },
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      });
    return duplicateCategory;
  };
}
