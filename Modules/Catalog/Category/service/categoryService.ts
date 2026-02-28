import { Repo } from "../repo/Repo.js";
import { prisma } from "../../../../src/shared/prisma.js";

export class CategoryService {
  constructor(private repo: Repo) {}

  findCategoryById = async (categoryId: string) => {
    if (!categoryId || categoryId.trim() === "") {
      throw new Error("Category ID is required");
    }

    const category = await this.repo.findCategoryById(categoryId, prisma);

    if (!category) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    return category;
  };

  findAllCategories = async () => {
    return await this.repo.findAllCategories(prisma);
  };
}
