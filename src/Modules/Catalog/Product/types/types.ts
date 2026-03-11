// export interface VariantImage {
//   id: string;
//   url: string;
//   isPrimary?: boolean;
// }
// export interface ProductVariant {
//   id: string;
//   sku: string;
//   color?: string;
//   size?: string;
//   weight: string;
//   price: number;
//   stockLevel: number;
//   images: VariantImage[];
// }
// export interface getAllProductsResponse {
//   id: string;
//   name: string;
//   producer: string;
//   variants: ProductVariant[];
// }
// export interface addProductInput {
//   name: string;
//   producer: string;
//   categories: number[];
//   variants: [
//     {
//       sku: string;
//       color?: string;
//       size?: string;
//       weight: string;
//       price: number;
//       stockLevel: number;
//       images: VariantImage[];
//       inventories: [
//         {
//           id: string;
//           stockLevel: number;
//           restock: number;
//         },
//       ];
//     },
//   ];
// }

// Reusable Interfaces

export interface VariantImage {
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

export interface InventoryStock {
  id: string; // inventory ID
  stockLevel: number;
  restock: number;
}

export interface ProductVariantBase {
  sku: string;
  color?: string;
  size?: string;
  weight: string;
  price: number;
}

export interface ProductVariantInput extends ProductVariantBase {
  images: VariantImage[];
  inventories: InventoryStock[];
}

export interface ProductVariantResponse extends ProductVariantBase {
  id: string;
  stockLevel: number;
  images: VariantImage[];
}

export interface ProductBase {
  name: string;
  producer?: string;
}

export interface AddProductInput extends ProductBase {
  categories: string[];
  variants: ProductVariantInput[];
}

export interface ProductResponse extends ProductBase {
  id: string;
  variants: ProductVariantResponse[];
}

export interface AddProductResponse {
  id: string;
  name: string;
  producer: string | null;
  categories: {
    category: {
      name: string;
    };
  }[];
  variants: {
    productId: string;
    id: string;
  }[];
}

export interface GetAllProductsVariantResponse {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  weight: string;
  price: any; // Decimal from Prisma
  images: VariantImage[];
}

export interface GetAllProductsResponse {
  id: string;
  name: string;
  producer: string | null;
  isActive: boolean;
  variants: GetAllProductsVariantResponse[];
  categories: {
    category: {
      name: string;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateProductVariantInput {
  variantId: string;
  sku?: string;
  color?: string | null;
  size?: string | null;
  weight?: string;
  price?: number;
}

export interface UpdateProductInput {
  productId: string;
  name?: string;
  producer?: string | null;
  isActive?: boolean;
  variants?: UpdateProductVariantInput[];
}

export interface UpdateProductResponse {
  id: string;
  name: string;
  producer: string | null;
  isActive: boolean;
  updatedAt: Date;
}

export interface DeleteProductResponse {
  id: string;
  message: string;
  deletedAt: Date;
}

export interface GetProductByIdResponse {
  id: string;
  name: string;
  producer: string | null;
  isActive: boolean;
  deletedAt: Date | null;
}

export interface cursorData{
  createdAt:Date,
  id:string
}

export interface PaginatedProducts{
  data:GetAllProductsResponse[],
  nextCursor:string | null
}