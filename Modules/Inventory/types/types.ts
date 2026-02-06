export interface Inventory{
    id:string,
    name:string,
    location:string,
    deletedAt:Date | null
}
export interface findInventoryByIdResponse{
    id:string,
    name:string,
    location:string
}
export interface findInventoryByNameAndLocationInput{
    name:string,
    location:string
}
export interface findInventoryByNameAndLocationResponse{
    name:string,
    location:string
    id:string
}

export interface AddInventoryInput{
    name:string;
    location:string;
}
export interface AddInventoryResponse{
    id:string;
    name:string;
    location:string;
}
export interface updateInventoryInput{
    name?:string,
    location?:string
}
export interface addProductVariantInInventoryInput{
    productVariantId:string;
    inventoryId:string;
    stockLevel:number,
    restockAlert:number
}
export interface updateProductVariantStockLevel{
    productVariantId:string;
    inventoryId:string;
    stockLevel:number;
}

export interface getProductVariantStockFromInventoryInput{
    productVariantId:string,
    inventoryId:string;
}
export interface getProductVariantStockFromInventoryResponse{
    productVariantId:string,
    inventoryId:string;
    inventory:{
        location:string;
    }
    stockLevel:number
}

