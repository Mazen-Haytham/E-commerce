import { PrismaInventory } from "../repo/inventoryRepo.js";
import { AppError } from "../../../utils/AppError.js";
export class InventoryRepoFactory{
    static getInventoryRepo(db:string){
        if(db.toLocaleLowerCase()==="prisma")
            return new PrismaInventory();
        else throw new AppError("UnSupported UserRepo", 500);
    } 
}