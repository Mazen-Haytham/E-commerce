import { ProductApi } from "./productApi.js";
import { ProductService } from "../service/productService.js";

export class ProductApiImp implements ProductApi {
  constructor(private readonly productService: ProductService) {}

  async findProductById(productId: string) {
    const product = await this.productService.getProductById(productId);
    return product;
  }

  async findProductVariantById(variantId: string) {
    const variant = await this.productService.getProductVariantById(variantId);
    return variant;
  }
}
