export interface ProductApi {
  findProductById(productId: string): Promise<any>;
  findProductVariantById(variantId: string): Promise<any>;
}
