import { Request, Response, NextFunction } from "express";
import { ProductService } from "../service/productService";
import {
  AddProductInput,
  UpdateProductInput,
  GetAllProductsResponse,
  AddProductResponse,
  UpdateProductResponse,
  DeleteProductResponse,
} from "../types/types";

export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Get all active products with variants
   * GET /products
   */
  getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products: GetAllProductsResponse[] =
        await this.productService.getAllProducts();

      res.status(200).json({
        status: "Success",
        data: products,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add a new product with variants
   * POST /products
   */
  addProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input: AddProductInput = req.body;

      // Validate input
      if (!input.name || !input.variants || input.variants.length === 0) {
        return res.status(400).json({
          status: "Error",
          data: {
            message: "Product name and at least one variant are required",
          },
        });
      }

      if (!Array.isArray(input.categories)) {
        return res.status(400).json({
          status: "Error",
          data: { message: "Categories must be an array" },
        });
      }

      const product: AddProductResponse =
        await this.productService.addProduct(input);

      res.status(201).json({
        status: "Success",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a product and/or its variants
   * PATCH /products/:id
   */
  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.id;
      const updateData = req.body;

      // Ensure productId is included in the input
      const input: UpdateProductInput = {
        productId,
        ...updateData,
      };

      // Validate that productId is provided
      if (!productId) {
        return res.status(400).json({
          status: "Error",
          data: { message: "Product ID is required" },
        });
      }

      const updatedProduct: UpdateProductResponse =
        await this.productService.updateProduct(input);

      res.status(200).json({
        status: "Success",
        data: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft delete a product
   * DELETE /products/:id
   */
  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.id;

      // Validate that productId is provided
      if (!productId) {
        return res.status(400).json({
          status: "Error",
          data: { message: "Product ID is required" },
        });
      }

      const result: DeleteProductResponse =
        await this.productService.deleteProduct(productId as string );

      res.status(200).json({
        status: "Success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
