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

