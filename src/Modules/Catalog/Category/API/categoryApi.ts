export interface CategoryApi {
  findCategoryById(categoryId: string): Promise<any>;
}
