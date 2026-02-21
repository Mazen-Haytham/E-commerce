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
  id: string;
  url: string;
  isPrimary?: boolean;
}

export interface InventoryStock {
  id: string;        // inventory ID
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
  stockLevel: number;
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
  categories: number[];
  variants: ProductVariantInput[];
}

export interface ProductResponse extends ProductBase {
  id: string;
  variants: ProductVariantResponse[];
}
