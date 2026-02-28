import { AppError } from "../../../../utils/AppError.js";
import { UserRepo } from "../repo/Repo.js";
import { PrismaUserRepo } from "../repo/userRepo.js";

export class RepoFactory {
  static getUserRepo(userRepoDB: string): UserRepo {
    if (userRepoDB.toLocaleLowerCase() === "prisma")
      return new PrismaUserRepo();
    else throw new AppError("UnSupported UserRepo", 500);
  }
}
