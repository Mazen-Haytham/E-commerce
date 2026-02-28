export interface addCategoryInput{
    name:string
}

export interface CategoryResponse{
    id:string,
    name:string
}
export interface updateCategory{
    id:string,
    newName:string
}
export interface addCategoryResponse{
    count:number
}