import { CategoryApi } from "./categoryApi.js";
import { CategoryService } from "../service/categoryService.js";

export class CategoryApiImp implements CategoryApi {
  constructor(private readonly categoryService: CategoryService) {}

  async findCategoryById(categoryId: string) {
    const category = await this.categoryService.findCategoryById(categoryId);
    return category;
  }
}
